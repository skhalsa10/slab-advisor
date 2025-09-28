#!/bin/bash

# Complete Pokemon TCG Data Pipeline Runner
# Runs all sync scripts in proper sequence: auto_sync → supplemental → variants → prices
# Designed for both manual execution and cron job automation

# Record start time
pipeline_start_time=$(date +%s)
pipeline_start_date=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================================"
echo "Starting COMPLETE Pokemon TCG Data Pipeline at: $pipeline_start_date"
echo "========================================================"

# Prevent screen blanking and power saving (if GUI is available)
export DISPLAY=:0
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null

# Change to script directory (works both locally and on Pi)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Initialize overall tracking
total_errors=0
step_count=0

# Function to run a script step with timing and error handling
run_script_step() {
    local step_name="$1"
    local script_command="$2"
    local step_num="$3"

    step_count=$((step_count + 1))
    echo ""
    echo "========================================================"
    echo "STEP $step_num: $step_name"
    echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================================"

    # Record step start time
    step_start_time=$(date +%s)

    # Run the script
    eval "$script_command"
    step_exit_code=$?

    # Record step end time and calculate duration
    step_end_time=$(date +%s)
    step_duration=$((step_end_time - step_start_time))
    step_hours=$((step_duration / 3600))
    step_minutes=$(((step_duration % 3600) / 60))
    step_seconds=$((step_duration % 60))

    # Report step completion
    echo "--------------------------------------------------------"
    echo "STEP $step_num COMPLETED: $step_name"
    echo "Duration: ${step_hours}h ${step_minutes}m ${step_seconds}s"

    if [ $step_exit_code -eq 0 ]; then
        echo "Status: SUCCESS ✓"
    else
        echo "Status: FAILED ✗ (exit code: $step_exit_code)"
        total_errors=$((total_errors + 1))
    fi
    echo "--------------------------------------------------------"

    return $step_exit_code
}

# STEP 1: Foundation Data Sync
run_script_step "Foundation Data Sync (TCGdx)" "python3 auto_sync_tcg_data.py" 1

# STEP 2: Supplemental Metadata and TCGPlayer Group Mapping
run_script_step "Supplemental Metadata Sync" "python3 sync_supplemental_sets_data.py" 2

# STEP 3: Complex Card Variant Mapping
run_script_step "Card Variant Mapping" "python3 sync_card_variants_v2.py --all-sets" 3

# STEP 4: Price Updates
run_script_step "Price Updates" "python3 update_pokemon_prices.py --all" 4

# Calculate total pipeline duration
pipeline_end_time=$(date +%s)
pipeline_end_date=$(date '+%Y-%m-%d %H:%M:%S')
total_duration=$((pipeline_end_time - pipeline_start_time))
total_hours=$((total_duration / 3600))
total_minutes=$(((total_duration % 3600) / 60))
total_seconds=$((total_duration % 60))

# Final summary
echo ""
echo "========================================================"
echo "COMPLETE PIPELINE SUMMARY"
echo "========================================================"
echo "Started:    $pipeline_start_date"
echo "Completed:  $pipeline_end_date"
echo "Total time: ${total_hours}h ${total_minutes}m ${total_seconds}s"
echo "Steps run:  $step_count"
echo "Errors:     $total_errors"

if [ $total_errors -eq 0 ]; then
    echo "Overall Status: SUCCESS ✓"
    echo "All Pokemon TCG data is now current!"
else
    echo "Overall Status: PARTIAL SUCCESS ⚠️"
    echo "$total_errors step(s) failed - check logs above"
fi
echo "========================================================"

# Re-enable screen blanking (optional)
# xset s on 2>/dev/null
# xset +dpms 2>/dev/null

# Exit with error count (0 = success, >0 = some failures)
exit $total_errors