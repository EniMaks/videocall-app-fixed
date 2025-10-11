#!/bin/bash

# start-turn-server.sh - Script to start Coturn TURN server for local development
# Usage: ./start-turn-server.sh

echo "🚀 Starting Coturn TURN server for local development..."

# Check if coturn is installed
if ! command -v turnserver &> /dev/null; then
    echo "❌ Coturn is not installed. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt update && sudo apt install coturn"
    exit 1
fi

# Check if config file exists
if [ ! -f "coturn/turnserver.conf" ]; then
    echo "❌ Coturn config file not found at coturn/turnserver.conf"
    exit 1
fi

# Start TURN server
echo "🔧 Starting TURN server on port 3478..."
echo "📝 Config: coturn/turnserver.conf"
echo "👤 User: turnuser:supersecretturnpassword"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

turnserver -c coturn/turnserver.conf --user=turnuser:supersecretturnpassword