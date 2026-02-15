#!/usr/bin/env python3
"""
MooER-MTL-5K-1.5B ASR Daemon Service
Lightweight LLM-based Speech Recognition Model
Optimized for MUSA GPUs
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

# Add MooER to path
MOOER_PATH = Path(__file__).parent.parent.parent / 'models' / 'MooER'
sys.path.insert(0, str(MOOER_PATH / 'src'))

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024  # 25MB max

# Global model instance
model = None
tokenizer = None
device = None
model_config = None
cmvn = None
adapter_downsample_rate = None
prompt_template = None
prompt_org = None

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

def get_device():
    """Get available device"""
    musa_available, device_count = check_musa_available()
    if musa_available:
        return 'musa:0'

    import torch
    if torch.cuda.is_available():
        return 'cuda:0'

    return 'cpu'

def init_model():
    """Initialize MooER model once at startup"""
    global model, tokenizer, device, model_config, cmvn, adapter_downsample_rate
    global prompt_template, prompt_org

    try:
        import torch
        import torchaudio
        from mooer.configs import asr_config
        from mooer.models import mooer_model
        from mooer.datasets.speech_processor import load_cmvn

        print("[MooER Daemon] Initializing MooER-MTL-5K-1.5B...", file=sys.stderr)

        # Get device
        device = get_device()
        print(f"[MooER Daemon] Using device: {device}", file=sys.stderr)

        # Model config
        model_config = asr_config.ModelConfig()

        # Set paths to downloaded model
        model_cache = Path.home() / '.cache' / 'modelscope' / 'hub' / 'MooreThreadsSpeech' / 'MooER-MTL-5K-1.5B'

        model_config.llm_path = str(model_cache / 'Qwen2-1.5B-Instruct')
        model_config.encoder_path = str(model_cache / 'paraformer_encoder' / 'paraformer-encoder.pth')
        model_config.adapter_path = str(model_cache / 'ast' / 'adapter_project.pt')
        model_config.lora_dir = str(model_cache / 'ast' / 'lora_weights')
        model_config.cmvn_path = str(model_cache / 'paraformer_encoder' / 'am.mvn')
        model_config.prompt_key = 'asr'  # ASR task
        model_config.llm_dim = 1536  # Qwen2-1.5B dimension

        print(f"[MooER Daemon] Loading model from: {model_cache}", file=sys.stderr)

        # Initialize model
        model, tokenizer = mooer_model.init_model(model_config=model_config)
        model.to(device)
        model.eval()

        # Load CMVN
        from mooer.datasets.speech_processor import load_cmvn
        cmvn = load_cmvn(model_config.cmvn_path)
        adapter_downsample_rate = model_config.adapter_downsample_rate

        # Prompt setup
        PROMPT_TEMPLATE_DICT = {
            'qwen': "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
        }
        PROMPT_DICT = {
            'asr': "Transcribe speech to text. ",
            'ast': "Translate speech to english text. ",
        }

        prompt_template = PROMPT_TEMPLATE_DICT['qwen']
        prompt_org = PROMPT_DICT['asr']

        print(f"[MooER Daemon] Model loaded successfully on {device}!", file=sys.stderr)
        print(f"[MooER Daemon] Ready to accept requests", file=sys.stderr)

        return True

    except Exception as e:
        print(f"[MooER Daemon] ERROR: Failed to initialize model: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def process_wav(wav_path):
    """Process audio file for inference"""
    import torch
    import torchaudio
    from torchaudio.transforms import Resample
    from mooer.datasets.speech_processor import compute_fbank, apply_lfr, apply_cmvn

    audio_raw, sample_rate = torchaudio.load(wav_path)
    if sample_rate != 16000:
        resampler = Resample(orig_freq=sample_rate, new_freq=16000)
        audio_raw = resampler(audio_raw)

    if audio_raw.shape[0] > 1:
        audio_raw = audio_raw.mean(dim=0, keepdim=True)

    audio_raw = audio_raw[0]
    prompt = prompt_template.format(prompt_org)
    audio_mel = compute_fbank(waveform=audio_raw)
    audio_mel = apply_lfr(inputs=audio_mel, lfr_m=7, lfr_n=6)
    audio_mel = apply_cmvn(audio_mel, cmvn=cmvn)
    audio_length = audio_mel.shape[0]
    audio_length = audio_length // adapter_downsample_rate
    audio_pseudo = torch.full((audio_length,), -1)
    prompt_ids = tokenizer.encode(prompt)
    prompt_length = len(prompt_ids)
    prompt_ids = torch.tensor(prompt_ids, dtype=torch.int64)
    example_ids = torch.cat((audio_pseudo, prompt_ids))
    example_mask = example_ids.ge(-1)

    items = {
        "input_ids": example_ids.unsqueeze(0).to(device),
        "attention_mask": example_mask.unsqueeze(0).to(device),
        "audio_mel": audio_mel.unsqueeze(0).to(device),
        "audio_length": torch.tensor([audio_length]).to(device),
        "prompt_length": torch.tensor([prompt_length]).to(device),
    }
    return items

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
        'model': 'MooER-MTL-5K-1.5B'
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
        import torch

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

        # Process audio
        batch = process_wav(temp_file)

        # Inference
        load_dtype = model_config.get('load_dtype', 'bfloat16')
        dtype = torch.bfloat16 if load_dtype == 'bfloat16' else torch.float16

        context_scope = torch.musa.amp.autocast if 'musa' in device else torch.cuda.amp.autocast

        with torch.no_grad():
            with context_scope(dtype=dtype):
                output_ids = model.generate(
                    **batch,
                    max_new_tokens=256,
                    num_beams=1,
                    do_sample=False
                )

        # Decode output
        output_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)

        processing_time = time.time() - start_time

        print(f"[MooER Daemon] Transcription complete: {len(output_text)} chars in {processing_time:.2f}s", file=sys.stderr)

        return jsonify({
            'success': True,
            'text': output_text.strip(),
            'language': 'auto',
            'device': device,
            'model': 'MooER-MTL-5K-1.5B',
            'processing_time': processing_time
        })

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
    print("[MooER Daemon] Starting MooER-MTL-5K-1.5B ASR Daemon Service...", file=sys.stderr)

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
