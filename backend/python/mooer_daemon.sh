#!/bin/bash
# MooER ASR Daemon Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/mooer_daemon.py"
LOG_FILE="/tmp/mooer_daemon.log"
PID_FILE="/tmp/mooer_daemon.pid"

start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "MooER daemon is already running (PID: $PID)"
            return 1
        fi
    fi

    echo "Starting MooER ASR daemon..."
    echo "Model will load in background (5-10 minutes on first run)"
    echo "Logs: $LOG_FILE"

    nohup python3 "$PYTHON_SCRIPT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    echo "MooER daemon started (PID: $(cat $PID_FILE))"
    echo "Check status: $0 status"
    echo "View logs: tail -f $LOG_FILE"
}

stop() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping MooER daemon (PID: $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            echo "MooER daemon stopped"
        else
            echo "MooER daemon not running"
            rm -f "$PID_FILE"
        fi
    else
        echo "MooER daemon not running (no PID file)"
    fi
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "MooER daemon is running (PID: $PID)"

            # Check if ready
            if curl -s http://localhost:5001/health > /dev/null 2>&1; then
                HEALTH=$(curl -s http://localhost:5001/health)
                echo "Status: $HEALTH"
            else
                echo "Status: Initializing (model loading...)"
            fi

            return 0
        else
            echo "MooER daemon is not running (stale PID file)"
            return 1
        fi
    else
        echo "MooER daemon is not running"
        return 1
    fi
}

logs() {
    tail -f "$LOG_FILE"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
