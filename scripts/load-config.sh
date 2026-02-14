#!/bin/bash
# Configuration Loader for Shell Scripts
# Reads services.json and exports variables

CONFIG_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$CONFIG_SCRIPT_DIR/../config/services.json"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required to parse configuration. Please install jq." >&2
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file not found: $CONFIG_FILE" >&2
    exit 1
fi

# Parse configuration using jq
export MAVIN_CONFIG_VERSION=$(jq -r '.version' "$CONFIG_FILE")

# Frontend configuration
export FRONTEND_PORT=$(jq -r '.services.frontend.ports.primary' "$CONFIG_FILE")
export FRONTEND_PORTS=$(jq -r '.services.frontend.ports.fallback | join(" ")' "$CONFIG_FILE")
export FRONTEND_ALL_PORTS="$FRONTEND_PORT $FRONTEND_PORTS"
export FRONTEND_DIR=$(jq -r '.services.frontend.directory' "$CONFIG_FILE")
export FRONTEND_URL=$(jq -r '.services.frontend.url' "$CONFIG_FILE")

# Backend configuration
export BACKEND_PORT=$(jq -r '.services.backend.port' "$CONFIG_FILE")
export BACKEND_DIR=$(jq -r '.services.backend.directory' "$CONFIG_FILE")
export BACKEND_URL=$(jq -r '.services.backend.url' "$CONFIG_FILE")
export BACKEND_CORS_ORIGINS=$(jq -r '.services.backend.cors.origins | join(",")' "$CONFIG_FILE")

# ASR configuration
export ASR_PORT=$(jq -r '.services.asr.port' "$CONFIG_FILE")
export ASR_CONTAINER=$(jq -r '.services.asr.container.name' "$CONFIG_FILE")
export ASR_IMAGE=$(jq -r '.services.asr.container.image' "$CONFIG_FILE")
export ASR_IMAGE_PATH=$(jq -r '.services.asr.container.imagePath' "$CONFIG_FILE")
export ASR_URL=$(jq -r '.services.asr.url' "$CONFIG_FILE")
export ASR_SSL_REJECT_UNAUTHORIZED=$(jq -r '.services.asr.ssl.rejectUnauthorized' "$CONFIG_FILE")

# TTS configuration
export TTS_PORT=$(jq -r '.services.tts.ports.primary' "$CONFIG_FILE")
export TTS_PORTS=$(jq -r '.services.tts.ports.fallback | join(" ")' "$CONFIG_FILE")
export TTS_ALL_PORTS="$TTS_PORT $TTS_PORTS"
export TTS_SCRIPT=$(jq -r '.services.tts.script' "$CONFIG_FILE")

# OpenClaw configuration
export OPENCLAW_COMMAND=$(jq -r '.services.openclaw.command' "$CONFIG_FILE")

# Paths configuration (make absolute)
PROJECT_ROOT="$(cd "$CONFIG_SCRIPT_DIR/.." && pwd)"
export LOGS_DIR="$PROJECT_ROOT/$(jq -r '.paths.logs' "$CONFIG_FILE")"
export PIDS_DIR="$PROJECT_ROOT/$(jq -r '.paths.pids' "$CONFIG_FILE")"
export UPLOADS_DIR=$(jq -r '.paths.uploads' "$CONFIG_FILE")
export AUDIO_DIR="$PROJECT_ROOT/$(jq -r '.paths.audio' "$CONFIG_FILE")"

# API configuration
export API_BASE_URL=$(jq -r '.api.baseUrl' "$CONFIG_FILE")
export API_VOICE_ASR=$(jq -r '.api.endpoints.voice.asr' "$CONFIG_FILE")
export API_VOICE_TTS=$(jq -r '.api.endpoints.voice.tts' "$CONFIG_FILE")
export API_VOICE_STATUS=$(jq -r '.api.endpoints.voice.status' "$CONFIG_FILE")
export API_HEALTH=$(jq -r '.api.endpoints.health' "$CONFIG_FILE")
export API_SERVICES_HEALTH=$(jq -r '.api.endpoints.services.health' "$CONFIG_FILE")

# Function to get service configuration
get_service_config() {
    local service=$1
    jq -r ".services.$service" "$CONFIG_FILE"
}

# Function to print configuration (for debugging)
print_config() {
    echo "Mavin Services Configuration (v${MAVIN_CONFIG_VERSION})"
    echo "============================================"
    echo "Frontend: $FRONTEND_URL (ports: $FRONTEND_ALL_PORTS)"
    echo "Backend:  $BACKEND_URL (port: $BACKEND_PORT)"
    echo "ASR:      $ASR_URL (port: $ASR_PORT, container: $ASR_CONTAINER)"
    echo "TTS:      ports: $TTS_ALL_PORTS"
    echo "OpenClaw: $OPENCLAW_COMMAND"
    echo "Paths:"
    echo "  Logs: $LOGS_DIR"
    echo "  PIDs: $PIDS_DIR"
    echo "  Uploads: $UPLOADS_DIR"
    echo "  Audio: $AUDIO_DIR"
    echo "============================================"
}

# If script is run directly, print configuration
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    print_config
fi
