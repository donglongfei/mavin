#!/usr/bin/env python3
"""
MT LiteTTS WebSocket Streaming Server
Provides real-time TTS streaming via WebSocket
"""

import asyncio
import json
import base64
import io
from pathlib import Path

from flask import Flask, request, jsonify
from flask_sock import Sock
import numpy as np
from scipy.io.wavfile import write

from mt_litetts_streaming import MTLiteTTSStreaming

app = Flask(__name__)
sock = Sock(app)

# Global TTS instance (singleton pattern - model loaded once)
tts = MTLiteTTSStreaming()


@app.route('/api/tts/status', methods=['GET'])
def status():
    """Check TTS service status"""
    return jsonify({
        'success': True,
        'service': 'MT LiteTTS Streaming',
        'model': 'mt_litetts_v4d',
        'voice': '程小可 (Cheng Xiaoke)',
        'streaming': True
    })


@app.route('/api/tts/synthesize', methods=['POST'])
def synthesize():
    """
    Non-streaming synthesis
    Returns complete audio file
    """
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400

        # Generate complete audio
        wav_bytes = tts.synthesize_to_wav_bytes(text)

        # Save to file
        output_path = Path('/tmp') / f'tts_{hash(text)}.wav'
        with open(output_path, 'wb') as f:
            f.write(wav_bytes)

        return jsonify({
            'success': True,
            'audio_path': str(output_path),
            'audio_base64': base64.b64encode(wav_bytes).decode('utf-8'),
            'file_size': len(wav_bytes),
            'text_length': len(text)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@sock.route('/api/tts/stream')
def stream(ws):
    """
    WebSocket streaming endpoint
    Client sends: {"text": "你好世界"}
    Server streams: audio chunks as base64-encoded WAV
    """
    print("WebSocket client connected")

    while True:
        try:
            # Receive message from client
            message = ws.receive()

            if message is None:
                break

            data = json.loads(message)
            text = data.get('text', '')
            chunk_size = data.get('chunk_size', 50)

            if not text:
                ws.send(json.dumps({
                    'type': 'error',
                    'error': 'No text provided'
                }))
                continue

            # Send start signal
            ws.send(json.dumps({
                'type': 'start',
                'text': text,
                'message': 'Starting synthesis...'
            }))

            # Stream audio chunks
            for chunk_data in tts.synthesize_streaming(text, chunk_size):
                # Convert audio to WAV bytes
                wav_buffer = io.BytesIO()
                write(
                    wav_buffer,
                    chunk_data['sample_rate'],
                    chunk_data['audio']
                )
                wav_buffer.seek(0)
                wav_bytes = wav_buffer.read()

                # Send chunk
                ws.send(json.dumps({
                    'type': 'chunk',
                    'chunk_index': chunk_data['chunk_index'],
                    'total_chunks': chunk_data['total_chunks'],
                    'text': chunk_data['text'],
                    'audio_base64': base64.b64encode(wav_bytes).decode('utf-8'),
                    'sample_rate': chunk_data['sample_rate']
                }))

            # Send completion signal
            ws.send(json.dumps({
                'type': 'complete',
                'message': 'Synthesis complete'
            }))

        except Exception as e:
            print(f"WebSocket error: {e}")
            try:
                ws.send(json.dumps({
                    'type': 'error',
                    'error': str(e)
                }))
            except:
                pass
            break

    print("WebSocket client disconnected")


if __name__ == '__main__':
    print("Starting MT LiteTTS Streaming Server...")
    print("WebSocket endpoint: ws://localhost:5000/api/tts/stream")
    print("HTTP endpoint: http://localhost:5000/api/tts/synthesize")

    app.run(host='0.0.0.0', port=5000, debug=True)
