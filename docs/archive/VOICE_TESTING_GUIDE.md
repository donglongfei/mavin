# Voice Services Unit Testing Guide

## Overview

Comprehensive unit tests for Moore Threads voice services:
- **MooER ASR** - Speech-to-Text with MUSA GPU
- **MT LiteTTS** - Text-to-Speech with MUSA GPU

## Test Coverage

### 1. Device Detection Tests
- ✅ MUSA GPU detection
- ✅ CUDA GPU detection
- ✅ CPU fallback
- ✅ Device info reporting

### 2. ASR Tests (MooER)
- ✅ Installation check
- ✅ Audio transcription
- ✅ Error handling
- ✅ Device selection

### 3. TTS Tests (MT LiteTTS)
- ✅ Installation check
- ✅ CPU synthesis
- ✅ GPU synthesis (MUSA/CUDA)
- ✅ Auto device selection
- ✅ Error handling

### 4. Integration Tests
- ✅ Roundtrip: Audio → Text → Audio
- ✅ Full pipeline timing

## Quick Start

### Run All Tests

```bash
cd backend/python
python3 test_voice_services.py
```

### Run Specific Test

```bash
# Test device detection
python3 test_voice_services.py --test TestDeviceDetection

# Test ASR only
python3 test_voice_services.py --test TestMooERAR

# Test TTS only
python3 test_voice_services.py --test TestMTLiteTTS

# Test specific method
python3 test_voice_services.py --test TestMTLiteTTS.test_tts_synthesis_gpu
```

### Verbose Output

```bash
python3 test_voice_services.py --verbose
```

## Test Requirements

### Required Dependencies

```bash
# ASR dependencies
pip install transformers librosa soundfile torch torch_musa

# TTS dependencies
# MT LiteTTS auto-downloads on first use (~500MB)
```

### Optional: Test Audio File

For full ASR testing, place a test audio file:

```bash
# Place your test audio file
cp your_test.mp3 backend/python/test_audio.mp3
```

Supported formats: mp3, wav, m4a, webm

## Test Cases

### Device Detection Tests

```python
# Tests available compute devices
test_asr_device_detection()  # Check ASR device support
test_tts_device_detection()  # Check TTS device support
```

**Expected Output:**
```
ASR Available devices: ['musa', 'cpu']
✓ MUSA GPU detected for ASR

TTS Available devices: ['musa', 'cpu']
TTS Device info: {
  "musa": {
    "available": true,
    "device_count": 1,
    "device_name": "Moore Threads MUSA GPU"
  }
}
✓ MUSA GPU detected for TTS
```

### ASR Tests

```python
# Test 1: Check dependencies
test_asr_installation_check()

# Test 2: Transcribe audio
test_asr_with_test_audio()

# Test 3: Error handling
test_asr_error_handling()
```

**Expected Output:**
```
✓ ASR Result:
  Text: 你好，这是一个测试
  Device: musa
  Processing time: 0.45s
  Language: zh
```

### TTS Tests

```python
# Test 1: Check installation
test_tts_installation_check()

# Test 2: CPU synthesis
test_tts_synthesis_cpu()

# Test 3: GPU synthesis
test_tts_synthesis_gpu()

# Test 4: Auto device selection
test_tts_auto_device_selection()

# Test 5: Error handling
test_tts_error_handling()
```

**Expected Output:**
```
Testing TTS with text: '你好世界' on CPU
✓ TTS Result:
  Audio path: /tmp/test.wav
  File size: 123456 bytes
  Device: cpu
  Processing time: 0.85s
  Voice: 程小可 (Cheng Xiaoke)

Testing TTS with text: '测试MUSA GPU加速' on MUSA
✓ TTS successfully used MUSA GPU!
  Actual device used: musa
```

### Integration Test

```python
# Full pipeline test
test_roundtrip_audio_text_audio()
```

**Expected Output:**
```
=== Integration Test: Audio → Text → Audio ===
Step 1: Transcribing audio...
  Transcribed: '你好世界'
Step 2: Synthesizing text...
  Synthesized: /tmp/output.wav
✓ Roundtrip successful!
  ASR device: musa
  TTS device: musa
  Total time: 1.35s
```

## Test Results Interpretation

### Success Example

```
======================================================================
TEST SUMMARY
======================================================================
Tests run: 12
Successes: 10
Failures: 0
Errors: 0
Skipped: 2
======================================================================
```

### Skipped Tests

Tests are skipped when:
- Service not installed (will auto-install on first use)
- No GPU available (CPU fallback works)
- No test audio file (optional)

**Skipped tests are normal** - they indicate optional features.

### Failure Example

```
FAIL: test_tts_synthesis_gpu
AssertionError: TTS failed: torch_musa not installed
```

**Fix:** Install torch_musa:
```bash
pip install torch_musa
```

## Performance Benchmarks

Run tests to benchmark your hardware:

### ASR Performance (MooER)

| Hardware | 10s Audio | 60s Audio | Real-Time Factor |
|----------|-----------|-----------|------------------|
| MUSA GPU | ~0.8s | ~4s | 0.13x |
| CUDA GPU | ~1s | ~5s | 0.17x |
| CPU | ~8s | ~40s | 1.3x |

### TTS Performance (MT LiteTTS)

| Hardware | Short (10 chars) | Paragraph (100 chars) |
|----------|------------------|----------------------|
| MUSA GPU | ~0.5s | ~3s |
| CUDA GPU | ~0.6s | ~3.5s |
| CPU | ~0.8s | ~5s |

## Continuous Integration

### Add to CI Pipeline

```yaml
# .github/workflows/test.yml
name: Voice Services Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'

      - name: Install dependencies
        run: |
          pip install transformers librosa soundfile torch

      - name: Run tests
        run: |
          cd backend/python
          python3 test_voice_services.py
```

## Debugging Tests

### Enable Debug Output

```bash
# Set Python to unbuffered mode
PYTHONUNBUFFERED=1 python3 test_voice_services.py --verbose
```

### Test Individual Components

```bash
# Test only device detection
python3 -c "from musa_asr import check_device; print(check_device())"

# Test only TTS device
python3 -c "from mt_litetts import check_device; print(check_device())"

# Check torch_musa
python3 -c "import torch_musa; print('MUSA:', torch_musa.is_available())"
```

### Common Issues

#### Issue: "musa_asr not available"
**Fix:**
```bash
cd backend/python
ls musa_asr.py  # Check if file exists
python3 -c "import musa_asr"  # Test import
```

#### Issue: "MT LiteTTS not installed"
**Note:** This is normal! MT LiteTTS auto-downloads (~500MB) on first synthesis.

#### Issue: "Test audio file not found"
**Solution:** This is optional. Tests work without it, but with limited ASR coverage.

## Manual Testing

### Test ASR Directly

```bash
cd backend/python

# With auto device
python3 musa_asr.py test_audio.mp3

# Force MUSA
python3 musa_asr.py test_audio.mp3 base zh

# Check output
cat output.json
```

### Test TTS Directly

```bash
cd backend/python

# Auto device
python3 mt_litetts.py "你好世界"

# Force MUSA
python3 mt_litetts.py "测试" output.wav musa

# Force CPU
python3 mt_litetts.py "测试" output.wav cpu

# Play result
aplay output.wav  # or vlc, mpv, etc.
```

## Test Coverage Report

Generate coverage report:

```bash
pip install coverage

# Run with coverage
coverage run test_voice_services.py

# Generate report
coverage report

# HTML report
coverage html
open htmlcov/index.html
```

## Best Practices

1. **Run tests before commits**
   ```bash
   git commit -m "..." && python3 backend/python/test_voice_services.py
   ```

2. **Test on target hardware**
   - Test on MUSA GPU hardware
   - Test CPU fallback
   - Test edge cases

3. **Keep test audio small**
   - Use short clips (5-10 seconds)
   - Keep file size under 1MB
   - Test different audio qualities

4. **Document expected results**
   - Update benchmarks when hardware changes
   - Note performance differences
   - Track regression

## Next Steps

1. ✅ Run unit tests: `python3 test_voice_services.py`
2. ⏳ Add integration tests with backend API
3. ⏳ Add frontend E2E tests
4. ⏳ Add performance regression tests
5. ⏳ Add stress tests (concurrent requests)

## Support

For test issues:
- Check logs: Tests print detailed output
- Enable verbose: `--verbose` flag
- Test components individually
- Check dependencies: `pip list | grep -E "torch|transformers|librosa"`

---

**Last Updated**: 2026-02-13
**Test Framework**: unittest
**Python Version**: 3.8+
