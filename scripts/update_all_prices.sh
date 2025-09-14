#!/bin/bash

# Keep system awake and run price update with timing

# Check for --force flag
force_flag=""
if [[ "$1" == "--force" ]]; then
    force_flag="--force"
    echo "Running with --force flag (ignoring 24-hour skip rule)"
fi

# Record start time
start_time=$(date +%s)
start_date=$(date '+%Y-%m-%d %H:%M:%S')

echo "=================================="
echo "Starting price update at: $start_date"
echo "=================================="

# Prevent screen blanking and power saving (if GUI is available)
export DISPLAY=:0
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null

# Run the price update
cd /home/pi/projects/slab-advisor/scripts
python3 update_pokemon_prices.py --all $force_flag

# Record end time
end_time=$(date +%s)
end_date=$(date '+%Y-%m-%d %H:%M:%S')

# Calculate duration
duration=$((end_time - start_time))
hours=$((duration / 3600))
minutes=$(((duration % 3600) / 60))
seconds=$((duration % 60))

echo "=================================="
echo "Price update completed at: $end_date"
echo "Total time: ${hours}h ${minutes}m ${seconds}s"
echo "=================================="

# Re-enable screen blanking (optional)
# xset s on 2>/dev/null
# xset +dpms 2>/dev/null