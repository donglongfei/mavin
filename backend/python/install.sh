#!/bin/bash

# Mavin Voice Service Installation Script
# This script installs all dependencies for local TTS and ASR

set -e  # Exit on error

echo "========================================="
echo "Mavin Local Voice Service Installation"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check pip
echo -e "${YELLOW}Checking pip...${NC}"
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}pip3 not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y python3-pip
fi

# Detect GPU
echo ""
echo -e "${YELLOW}Detecting GPU...${NC}"
GPU_TYPE="cpu"

# Check for MUSA
if python3 -c "import torch_musa; print(torch_musa.is_available())" 2>/dev/null | grep -q "True"; then
    GPU_TYPE="musa"
    echo -e "${GREEN}✓ MUSA GPU detected${NC}"
# Check for CUDA
elif python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
    GPU_TYPE="cuda"
    echo -e "${GREEN}✓ CUDA GPU detected${NC}"
else
    echo -e "${YELLOW}No GPU detected. Using CPU.${NC}"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing Python dependencies...${NC}"
cd "$(dirname "$0")"

pip3 install --user -r requirements.txt

# Install GPU-specific packages
if [ "$GPU_TYPE" = "musa" ]; then
    echo -e "${YELLOW}Installing MUSA support...${NC}"
    pip3 install --user torch-musa || echo -e "${YELLOW}Warning: torch-musa installation failed. Will use CPU fallback.${NC}"
elif [ "$GPU_TYPE" = "cuda" ]; then
    echo -e "${YELLOW}CUDA detected. Make sure you have PyTorch with CUDA support installed.${NC}"
    echo "Visit: https://pytorch.org/get-started/locally/"
fi

# Test installations
echo ""
echo -e "${YELLOW}Testing installations...${NC}"

# Test faster-whisper
if python3 -c "import faster_whisper" 2>/dev/null; then
    echo -e "${GREEN}✓ faster-whisper installed${NC}"
else
    echo -e "${RED}✗ faster-whisper installation failed${NC}"
    exit 1
fi

# Test piper-tts
if python3 -c "import piper" 2>/dev/null; then
    echo -e "${GREEN}✓ piper-tts installed (Python)${NC}"
elif command -v piper &> /dev/null; then
    echo -e "${GREEN}✓ piper installed (CLI)${NC}"
else
    echo -e "${YELLOW}⚠ piper-tts not found, attempting additional installation...${NC}"
    pip3 install --user piper-tts || echo -e "${YELLOW}Warning: piper-tts installation may need manual setup${NC}"
fi

# Create required directories
echo ""
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p ~/.cache/whisper
mkdir -p ~/.local/share/piper/voices
mkdir -p ../public/audio
mkdir -p /tmp/mavin-uploads

echo -e "${GREEN}✓ Directories created${NC}"

# Make scripts executable
chmod +x local_asr.py
chmod +x local_tts.py

echo ""
echo "========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================="
echo ""
echo "GPU Type: $GPU_TYPE"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd ../.. && pnpm dev"
echo "2. Test ASR: curl -X POST http://localhost:8002/api/voice/asr -F 'audio=@test.mp3'"
echo "3. Test TTS: curl -X POST http://localhost:8002/api/voice/tts -H 'Content-Type: application/json' -d '{\"text\":\"Hello\"}'"
echo ""
echo "Models will be downloaded automatically on first use."
echo "See VOICE_SETUP.md for full documentation."
echo ""
