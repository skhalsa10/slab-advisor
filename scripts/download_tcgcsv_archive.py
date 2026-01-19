#!/usr/bin/env python3
"""
TCGCSV Historical Price Archive Download Script

Downloads daily price archives from TCGCSV and extracts Pokemon data (category 3).
Skips dates that already have folders downloaded. Run manually for backfill operations.

Usage:
    python download_tcgcsv_archive.py           # Download all missing dates
    python download_tcgcsv_archive.py --status  # Show download status
    python download_tcgcsv_archive.py --dry-run # Preview what would be downloaded

Prerequisites:
    - 7zip must be installed:
      - macOS: brew install p7zip
      - Ubuntu/Debian: sudo apt install p7zip-full
      - Windows: Install 7-Zip from https://www.7-zip.org/

Data Source: https://tcgcsv.com/faq (Archive section)
"""

import os
import sys
import argparse
import requests
import shutil
import subprocess
from datetime import date, timedelta
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, DownloadColumn, TransferSpeedColumn
from rich.table import Table

# Initialize console for pretty output
console = Console()

# Constants
ARCHIVE_URL = "https://tcgcsv.com/archive/tcgplayer/prices-{date}.ppmd.7z"
DATA_DIR = "tcgCsvPrices"
POKEMON_CATEGORY_ID = "3"
FIRST_AVAILABLE_DATE = date(2024, 2, 8)


def get_all_dates() -> list[date]:
    """Generate list of all dates from first available to today."""
    dates = []
    current = FIRST_AVAILABLE_DATE
    today = date.today()

    while current <= today:
        dates.append(current)
        current += timedelta(days=1)

    return dates


def date_folder_exists(date_str: str) -> bool:
    """Check if the date folder with Pokemon data exists."""
    pokemon_folder = os.path.join(DATA_DIR, date_str, POKEMON_CATEGORY_ID)
    return os.path.isdir(pokemon_folder)


def download_archive(date_str: str) -> str | None:
    """
    Download the .7z archive for a specific date.
    Returns the path to the downloaded file, or None on failure.
    """
    url = ARCHIVE_URL.format(date=date_str)
    archive_filename = f"prices-{date_str}.ppmd.7z"
    archive_path = os.path.join(DATA_DIR, archive_filename)

    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            DownloadColumn(),
            TransferSpeedColumn(),
            console=console,
            transient=True
        ) as progress:
            task = progress.add_task(f"Downloading {date_str}", total=total_size)

            with open(archive_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        progress.update(task, advance=len(chunk))

        return archive_path

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            console.print(f"[yellow]Archive not available for {date_str} (404)[/yellow]")
        else:
            console.print(f"[red]HTTP error downloading {date_str}: {e}[/red]")
        return None
    except requests.exceptions.RequestException as e:
        console.print(f"[red]Error downloading {date_str}: {e}[/red]")
        return None


def extract_archive(archive_path: str) -> bool:
    """
    Extract the .7z archive using 7z command.
    Returns True on success, False on failure.
    """
    try:
        # Extract to DATA_DIR - the archive contains a date folder inside
        result = subprocess.run(
            ['7z', 'x', archive_path, f'-o{DATA_DIR}', '-y'],
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            console.print(f"[red]7z extraction failed: {result.stderr}[/red]")
            return False

        return True

    except FileNotFoundError:
        console.print("[red]Error: 7z not found. Please install p7zip:[/red]")
        console.print("[dim]  macOS: brew install p7zip[/dim]")
        console.print("[dim]  Ubuntu: sudo apt install p7zip-full[/dim]")
        return False
    except subprocess.TimeoutExpired:
        console.print("[red]7z extraction timed out[/red]")
        return False
    except Exception as e:
        console.print(f"[red]Error extracting archive: {e}[/red]")
        return False


def cleanup_non_pokemon_folders(date_str: str) -> bool:
    """
    Delete all folders except "3" (Pokemon) inside the date folder.
    Returns True on success, False on failure.
    """
    date_folder = os.path.join(DATA_DIR, date_str)

    if not os.path.isdir(date_folder):
        console.print(f"[red]Date folder not found: {date_folder}[/red]")
        return False

    try:
        deleted_count = 0
        for item in os.listdir(date_folder):
            item_path = os.path.join(date_folder, item)
            if os.path.isdir(item_path) and item != POKEMON_CATEGORY_ID:
                shutil.rmtree(item_path)
                deleted_count += 1

        if deleted_count > 0:
            console.print(f"[dim]  Cleaned up {deleted_count} non-Pokemon folders[/dim]")

        return True

    except Exception as e:
        console.print(f"[red]Error cleaning up folders: {e}[/red]")
        return False


def process_date(date_obj: date, dry_run: bool = False) -> bool:
    """
    Process a single date: download, extract, cleanup.
    Returns True on success, False on failure.
    """
    date_str = date_obj.isoformat()

    # Check if already downloaded
    if date_folder_exists(date_str):
        console.print(f"[dim]Skipping {date_str} - already downloaded[/dim]")
        return True

    if dry_run:
        console.print(f"[yellow]Would download: {date_str}[/yellow]")
        return True

    console.print(f"\n[blue]Processing {date_str}...[/blue]")

    # Step 1: Download
    archive_path = download_archive(date_str)
    if not archive_path:
        return False

    # Step 2: Extract
    console.print(f"[dim]  Extracting archive...[/dim]")
    if not extract_archive(archive_path):
        # Clean up failed download
        if os.path.exists(archive_path):
            os.remove(archive_path)
        return False

    # Step 3: Cleanup non-Pokemon folders
    if not cleanup_non_pokemon_folders(date_str):
        return False

    # Step 4: Delete the .7z file to save space
    try:
        os.remove(archive_path)
        console.print(f"[dim]  Deleted archive file[/dim]")
    except Exception as e:
        console.print(f"[yellow]Warning: Could not delete archive: {e}[/yellow]")

    console.print(f"[green]  Done: {date_str}[/green]")
    return True


def show_status():
    """Display status of downloaded vs missing dates."""
    console.print("\n[bold]TCGCSV Archive Download Status[/bold]\n")

    all_dates = get_all_dates()
    downloaded = []
    missing = []

    for d in all_dates:
        if date_folder_exists(d.isoformat()):
            downloaded.append(d)
        else:
            missing.append(d)

    # Create summary table
    table = Table(title="Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Count", justify="right", style="green")
    table.add_column("Percentage", justify="right", style="yellow")

    total = len(all_dates)
    table.add_row("Total dates available", str(total), "100%")
    table.add_row("Downloaded", str(len(downloaded)), f"{len(downloaded)/total*100:.1f}%")
    table.add_row("Missing", str(len(missing)), f"{len(missing)/total*100:.1f}%")

    console.print(table)

    # Show date range info
    console.print(f"\n[dim]Date range: {FIRST_AVAILABLE_DATE} to {date.today()}[/dim]")
    console.print(f"[dim]Data directory: {os.path.abspath(DATA_DIR)}[/dim]")

    # Show first few missing dates if any
    if missing:
        console.print(f"\n[yellow]First 10 missing dates:[/yellow]")
        for d in missing[:10]:
            console.print(f"  - {d.isoformat()}")
        if len(missing) > 10:
            console.print(f"  ... and {len(missing) - 10} more")
    else:
        console.print("\n[green]All dates downloaded![/green]")


def main():
    parser = argparse.ArgumentParser(
        description='Download TCGCSV historical price archives (Pokemon data only)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python download_tcgcsv_archive.py           # Download all missing dates
    python download_tcgcsv_archive.py --status  # Show download status
    python download_tcgcsv_archive.py --dry-run # Preview what would be downloaded
        """
    )

    parser.add_argument('--status', action='store_true',
                        help='Show current download status')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview what would be downloaded without actually downloading')

    args = parser.parse_args()

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    if args.status:
        show_status()
        return

    # Get all dates to process
    all_dates = get_all_dates()

    if args.dry_run:
        console.print("\n[bold yellow]DRY RUN - No files will be downloaded[/bold yellow]\n")

    console.print(f"[bold]TCGCSV Archive Download[/bold]")
    console.print(f"[dim]Date range: {FIRST_AVAILABLE_DATE} to {date.today()} ({len(all_dates)} days)[/dim]")
    console.print(f"[dim]Data directory: {os.path.abspath(DATA_DIR)}[/dim]\n")

    # Process each date
    success_count = 0
    skip_count = 0
    error_count = 0

    for i, d in enumerate(all_dates):
        date_str = d.isoformat()

        # Check if already exists before processing
        if date_folder_exists(date_str):
            skip_count += 1
            if not args.dry_run:
                # Only show skip message every 50 dates to reduce noise
                if skip_count % 50 == 0:
                    console.print(f"[dim]Skipped {skip_count} already-downloaded dates...[/dim]")
            continue

        if process_date(d, dry_run=args.dry_run):
            success_count += 1
        else:
            error_count += 1

    # Final summary
    console.print(f"\n[bold]Summary:[/bold]")
    console.print(f"  Skipped (already downloaded): [blue]{skip_count}[/blue]")
    if args.dry_run:
        console.print(f"  Would download: [yellow]{success_count}[/yellow]")
    else:
        console.print(f"  Successfully downloaded: [green]{success_count}[/green]")
        console.print(f"  Errors: [red]{error_count}[/red]")

    if args.dry_run:
        console.print("\n[yellow]DRY RUN - No files were downloaded[/yellow]")
    elif error_count > 0:
        console.print("\n[yellow]Some dates failed. Re-run the script to retry.[/yellow]")
    elif success_count > 0:
        console.print("\n[green]Download complete![/green]")


if __name__ == "__main__":
    main()
