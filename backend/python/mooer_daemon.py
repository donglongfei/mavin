#!/usr/bin/env python3
"""
MooER ASR Daemon Service
Persistent service that keeps MooER model loaded in memory
Handles ASR requests via HTTP API
"""

import sys
import json
import os
import time
import warnings
from pathlib import Path
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import tempfile

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024  # 25MB max

# Global model instance (loaded once at startup)
model = None
device = None

def check_musa_available():
    """Check if MUSA GPU is available"""
    try:
        import torch_musa
        if torch_musa.is_available():
            device_count = torch_musa.device_count()
            return True, device_count
    except ImportError:
        return False, 0
    return False, 0

def init_model():
    """Initialize MooER model once at startup"""
    global model, device

    try:
        from funasr import AutoModel
        import torch

        print("[ASR Daemon] Initializing...", file=sys.stderr)

        # Check MUSA availability
        musa_available, device_count = check_musa_available()

        # Select device
        if musa_available:
            device = 'musa'
            device_str = 'musa:0'
            print(f"[ASR Daemon] Using MUSA GPU ({device_count} devices)", file=sys.stderr)
        else:
            device = 'cpu'
            device_str = 'cpu'
            print(f"[MooER Daemon] Using CPU", file=sys.stderr)

        # Use Paraformer (reliable, fast, works with FunASR)
        model_path = 'iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch'
        print(f"[ASR Daemon] Loading Paraformer model...", file=sys.stderr)
        print(f"[ASR Daemon] First run: downloading ~500MB (1-2 minutes)", file=sys.stderr)

        model = AutoModel(
            model=model_path,
            device=device_str,
            disable_pbar=True,
            disable_log=False
        )

        print(f"[MooER Daemon] Model loaded successfully on {device_str}!", file=sys.stderr)
        print(f"[MooER Daemon] Ready to accept requests", file=sys.stderr)

        return True

    except Exception as e:
        print(f"[MooER Daemon] ERROR: Failed to initialize model: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    if model is None:
        return jsonify({
            'status': 'initializing',
            'ready': False
        }), 503

    return jsonify({
        'status': 'ready',
        'ready': True,
        'device': device,
        'model': 'MooER-MTL-80K'
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file"""
    global model

    if model is None:
        return jsonify({
            'success': False,
            'error': 'Model not initialized'
        }), 503

    start_time = time.time()
    temp_file = None

    try:
        # Get audio file from request
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400

        audio_file = request.files['audio']

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            audio_file.save(tmp.name)
            temp_file = tmp.name

        print(f"[MooER Daemon] Transcribing audio: {os.path.getsize(temp_file)} bytes", file=sys.stderr)

        # Transcribe
        result = model.generate(
            input=temp_file,
            batch_size_s=300,
            disable_pbar=True
        )

        processing_time = time.time() - start_time

        # Extract transcription
        if result and len(result) > 0:
            text = result[0].get('text', '').strip()
            duration = result[0].get('duration', 0)

            print(f"[MooER Daemon] Transcription complete: {len(text)} chars in {processing_time:.2f}s", file=sys.stderr)

            return jsonify({
                'success': True,
                'text': text,
                'language': 'auto',
                'duration': duration,
                'device': device,
                'model': 'MooER-MTL-80K',
                'processing_time': processing_time
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No transcription result'
            }), 500

    except Exception as e:
        print(f"[MooER Daemon] Transcription error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()

        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except:
                pass

if __name__ == '__main__':
    print("[MooER Daemon] Starting MooER ASR Daemon Service...", file=sys.stderr)

    # Initialize model before starting server
    if not init_model():
        print("[MooER Daemon] FATAL: Failed to initialize model", file=sys.stderr)
        sys.exit(1)

    # Start Flask server
    port = int(os.environ.get('MOOER_PORT', 5001))
    print(f"[MooER Daemon] Starting HTTP server on port {port}...", file=sys.stderr)

    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )
