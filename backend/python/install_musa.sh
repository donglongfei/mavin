#!/bin/bash

# MUSA-Native Voice Service Installation
# For Moore Threads GPU (S3000/S4000 series)

set -e

echo "============================================="
echo "MUSA-Native Voice Service Installation"
echo "Moore Threads GPU Optimized"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}pip3 not found. Installing...${NC}"
    python3 -m ensurepip --default-pip
fi

cd "$(dirname "$0")"

# Step 1: Check MUSA Toolkit
echo ""
echo -e "${BLUE}Step 1: Checking MUSA Toolkit...${NC}"

if [ -d "/usr/local/musa" ]; then
    echo -e "${GREEN}✓ MUSA Toolkit found at /usr/local/musa${NC}"
    export MUSA_HOME=/usr/local/musa
    export LD_LIBRARY_PATH=$MUSA_HOME/lib:$LD_LIBRARY_PATH
else
    echo -e "${YELLOW}⚠ MUSA Toolkit not found at /usr/local/musa${NC}"
    echo "Please install MUSA Toolkit rc2.1.0 first"
    echo "Visit: https://github.com/MooreThreads/torch_musa"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Install torch_musa
echo ""
echo -e "${BLUE}Step 2: Installing torch_musa...${NC}"

if python3 -c "import torch_musa" 2>/dev/null; then
    echo -e "${GREEN}✓ torch_musa already installed${NC}"
    python3 -c "import torch_musa; print(f'torch_musa version: {torch_musa.__version__}')"
else
    echo -e "${YELLOW}Installing torch_musa...${NC}"
    echo "Note: This requires MUSA Toolkit rc2.1.0"
    echo ""

    # Try pip install first
    pip3 install --user torch_musa || {
        echo -e "${YELLOW}⚠ pip install failed. You may need to install from source.${NC}"
        echo "See: https://github.com/MooreThreads/torch_musa"
        echo ""
        read -p "Continue with CPU fallback? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
fi

# Step 3: Install ASR dependencies (MooER)
echo ""
echo -e "${BLUE}Step 3: Installing MooER ASR dependencies...${NC}"

pip3 install --user \
    transformers>=4.35.0 \
    librosa>=0.10.0 \
    soundfile>=0.12.1 \
    accelerate>=0.20.0 \
    scipy>=1.10.0 \
    numpy>=1.24.0 \
    huggingface-hub>=0.19.0 \
    sentencepiece>=0.1.99

echo -e "${GREEN}✓ ASR dependencies installed${NC}"

# Step 4: Install TTS backend
echo ""
echo -e "${BLUE}Step 4: Installing TTS backend...${NC}"
echo "Select TTS backend:"
echo "1) Piper TTS (recommended - fast, CPU-efficient)"
echo "2) Coqui TTS (high quality, GPU-accelerated)"
echo "3) Edge TTS (online, requires internet)"
echo "4) All of the above"
echo "5) Skip TTS installation"
echo ""
read -p "Enter choice [1-5]: " tts_choice

case $tts_choice in
    1)
        echo "Installing Piper TTS..."
        pip3 install --user piper-tts>=1.2.0
        ;;
    2)
        echo "Installing Coqui TTS..."
        pip3 install --user TTS>=0.22.0
        ;;
    3)
        echo "Installing Edge TTS..."
        pip3 install --user edge-tts>=6.1.0
        ;;
    4)
        echo "Installing all TTS backends..."
        pip3 install --user piper-tts>=1.2.0 TTS>=0.22.0 edge-tts>=6.1.0
        ;;
    5)
        echo "Skipping TTS installation"
        ;;
    *)
        echo "Invalid choice. Installing Piper TTS (default)..."
        pip3 install --user piper-tts>=1.2.0
        ;;
esac

echo -e "${GREEN}✓ TTS backend installed${NC}"

# Step 5: Download MooER model
echo ""
echo -e "${BLUE}Step 5: MooER ASR Model${NC}"
echo "MooER models will be downloaded automatically on first use."
echo "Available models:"
echo "  - mtspeech/MooER-MTL-5K (smaller, 5K hours training)"
echo "  - mtspeech/MooER-MTL-80K (larger, 80K hours training) ← Recommended"
echo ""
read -p "Pre-download MooER model now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Downloading MooER-MTL-80K..."
    python3 -c "from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor; \
                processor = AutoProcessor.from_pretrained('mtspeech/MooER-MTL-80K'); \
                print('Model downloaded successfully!')" || {
        echo -e "${YELLOW}⚠ Download failed. Model will be downloaded on first use.${NC}"
    }
fi

# Step 6: Create directories
echo ""
echo -e "${BLUE}Step 6: Creating directories...${NC}"

mkdir -p ~/.cache/mooer
mkdir -p ~/.local/share/piper/voices
mkdir -p ../public/audio
mkdir -p /tmp/mavin-uploads

echo -e "${GREEN}✓ Directories created${NC}"

# Step 7: Make scripts executable
chmod +x musa_asr.py musa_tts.py

# Step 8: Test installation
echo ""
echo -e "${BLUE}Step 8: Testing installation...${NC}"

# Test torch_musa
if python3 -c "import torch_musa; print('MUSA available:', torch_musa.is_available())" 2>/dev/null; then
    echo -e "${GREEN}✓ torch_musa working${NC}"
else
    echo -e "${YELLOW}⚠ torch_musa not available (will use CPU fallback)${NC}"
fi

# Test transformers
if python3 -c "import transformers" 2>/dev/null; then
    echo -e "${GREEN}✓ transformers installed${NC}"
else
    echo -e "${RED}✗ transformers installation failed${NC}"
    exit 1
fi

# Test librosa
if python3 -c "import librosa" 2>/dev/null; then
    echo -e "${GREEN}✓ librosa installed${NC}"
else
    echo -e "${RED}✗ librosa installation failed${NC}"
    exit 1
fi

# Test TTS backends
TTS_BACKENDS=()
if python3 -c "import piper" 2>/dev/null || command -v piper &> /dev/null; then
    TTS_BACKENDS+=("piper")
    echo -e "${GREEN}✓ Piper TTS available${NC}"
fi
if python3 -c "from TTS.api import TTS" 2>/dev/null; then
    TTS_BACKENDS+=("coqui")
    echo -e "${GREEN}✓ Coqui TTS available${NC}"
fi
if python3 -c "import edge_tts" 2>/dev/null; then
    TTS_BACKENDS+=("edge")
    echo -e "${GREEN}✓ Edge TTS available${NC}"
fi

if [ ${#TTS_BACKENDS[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠ No TTS backend installed${NC}"
else
    echo -e "${GREEN}✓ TTS backends: ${TTS_BACKENDS[*]}${NC}"
fi

# Final summary
echo ""
echo "============================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "============================================="
echo ""
echo "System Info:"
python3 -c "
import sys
print(f'  Python: {sys.version.split()[0]}')
try:
    import torch_musa
    print(f'  MUSA: Available ({torch_musa.device_count()} devices)')
except:
    print('  MUSA: Not available (CPU fallback)')
try:
    import transformers
    print(f'  Transformers: {transformers.__version__}')
except:
    pass
"
echo ""
echo "MooER ASR: Ready (models: MooER-MTL-5K, MooER-MTL-80K)"
echo "TTS Backends: ${TTS_BACKENDS[*]}"
echo ""
echo "Next Steps:"
echo "1. Start backend: cd ../.. && pnpm dev"
echo "2. Test ASR: python3 musa_asr.py test.mp3"
echo "3. Test TTS: python3 musa_tts.py 'Hello world'"
echo "4. Check status: curl http://localhost:8002/api/voice/status"
echo ""
echo "Documentation:"
echo "  - VOICE_SETUP.md - Full API documentation"
echo "  - VOICE_QUICKSTART.md - Quick start guide"
echo ""
echo "Note: First run will download MooER model (~2GB)"
echo ""
