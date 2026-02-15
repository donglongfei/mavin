#!/usr/bin/env python3
"""
MT LiteTTS Streaming Service
Streams audio chunks in real-time for lower latency
"""

import os
import sys
import io
import re
import json
import asyncio
import base64
from pathlib import Path

import numpy as np
import torch
from pypinyin import pinyin, Style
from scipy.io.wavfile import write

# Add MT LiteTTS to path
LITETTS_DIR = Path.home() / "download" / "mt_litetts"
sys.path.insert(0, str(LITETTS_DIR))

import commons
import utils
from models import SynthesizerTrn
from text import text_to_sequence
from text.symbols import symbols


class MTLiteTTSStreaming:
    """MT LiteTTS Streaming TTS Service"""

    def __init__(self, model_dir=None):
        """Initialize the streaming TTS service"""
        if model_dir is None:
            model_dir = LITETTS_DIR / "serving_models" / "litetts_v4d"

        self.model_dir = Path(model_dir)
        self.config_path = self.model_dir / "config.json"
        self.ckpt_path = self.model_dir / "G_280000.pth"
        self.symbols_path = self.model_dir / "symbols.txt"

        self.device = "cpu"  # Can be changed to "musa" or "cuda"
        self.sid = 21  # Speaker ID for 程小可 voice

        # Model will be loaded lazily
        self.model = None
        self.hps = None
        self.symbol_table = None

    def _load_model(self):
        """Load model if not already loaded (singleton pattern)"""
        if self.model is not None:
            return

        print(f"Loading MT LiteTTS model from {self.ckpt_path}...", file=sys.stderr)

        # Load config
        self.hps = utils.get_hparams_from_file(str(self.config_path))

        # Load symbol table
        self.symbol_table = self._read_lexicon(str(self.symbols_path))

        # Create model
        self.model = SynthesizerTrn(
            len(symbols),
            self.hps.data.filter_length // 2 + 1,
            self.hps.train.segment_size // self.hps.data.hop_length,
            **self.hps.model
        ).to(self.device)

        self.model.eval()

        # Load checkpoint
        utils.load_checkpoint(str(self.ckpt_path), self.model, None)

        print("Model loaded successfully", file=sys.stderr)

    def _read_lexicon(self, lex_path, lower=True):
        """Read phoneme lexicon"""
        lexicon = {}
        with open(lex_path) as f:
            for line in f:
                temp = re.split(r"\s+", line.strip("\n"))
                word = temp[0]
                phones = temp[1:]
                if lower:
                    if word.lower() not in lexicon:
                        lexicon[word.lower()] = phones
                else:
                    if word not in lexicon:
                        lexicon[word] = phones
        return lexicon

    def _get_text(self, text):
        """Convert text to phoneme sequence"""
        text_norm = text_to_sequence(text, self.hps.data.text_cleaners)
        if self.hps.data.add_blank:
            text_norm = commons.intersperse(text_norm, 0)
        text_norm = torch.LongTensor(text_norm)
        return text_norm

    def _text_to_phonemes(self, text):
        """Convert Chinese text to phoneme sequence"""
        # Convert to pinyin
        pinyin_seq = [
            p[0] for p in pinyin(
                text,
                style=Style.TONE3,
                strict=False,
                neutral_tone_with_five=True,
                heteronym=False
            )
        ]

        # Convert pinyin to phonemes
        phoneme_seq = [
            self.symbol_table.get(p, ['sp2']) for p in pinyin_seq
        ]
        phoneme_seq = [x for a in phoneme_seq for x in a]

        return " ".join(phoneme_seq)

    def _split_text(self, text, max_length=50):
        """
        Split text into chunks for streaming
        Splits on sentence boundaries (。！？, etc.)
        """
        # Split on Chinese sentence delimiters
        sentences = re.split(r'([。！？，、；：])', text)

        chunks = []
        current_chunk = ""

        for i in range(0, len(sentences), 2):
            sentence = sentences[i]
            delimiter = sentences[i + 1] if i + 1 < len(sentences) else ""

            if len(current_chunk + sentence + delimiter) <= max_length:
                current_chunk += sentence + delimiter
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + delimiter

        if current_chunk:
            chunks.append(current_chunk.strip())

        # If no chunks (no delimiters), split by character count
        if not chunks:
            chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]

        return chunks

    def synthesize_chunk(self, text):
        """
        Synthesize a single text chunk
        Returns numpy array of audio samples
        """
        self._load_model()

        # Convert to phonemes
        phoneme_text = self._text_to_phonemes(text)
        stn_tst = self._get_text(phoneme_text)

        # Generate audio (suppress model's stdout messages)
        # Save original stdout
        original_stdout = sys.stdout
        sys.stdout = sys.stderr

        try:
            with torch.no_grad():
                x_tst = stn_tst.to(self.device).unsqueeze(0)
                x_tst_lengths = torch.LongTensor([stn_tst.size(0)]).to(self.device)
                sid = torch.tensor([self.sid], dtype=torch.int64)

                audio = self.model.infer(
                    x_tst,
                    x_tst_lengths,
                    noise_scale=0.667,
                    noise_scale_w=0.8,
                    length_scale=1,
                    sid=sid
                )[0][0, 0].data.cpu().float().numpy()
        finally:
            # Restore stdout
            sys.stdout = original_stdout

        # Add silence padding
        silence = np.zeros(int(self.hps.data.sampling_rate * 0.1))  # 100ms silence
        audio = np.concatenate([silence, audio, silence])

        return audio

    def synthesize_streaming(self, text, chunk_size=50):
        """
        Generator that yields audio chunks

        Args:
            text: Full text to synthesize
            chunk_size: Max characters per chunk

        Yields:
            (chunk_text, audio_array) tuples
        """
        chunks = self._split_text(text, max_length=chunk_size)

        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue

            print(f"Synthesizing chunk {i+1}/{len(chunks)}: {chunk}", file=sys.stderr)

            audio = self.synthesize_chunk(chunk)

            yield {
                'chunk_index': i,
                'total_chunks': len(chunks),
                'text': chunk,
                'audio': audio,
                'sample_rate': self.hps.data.sampling_rate
            }

    def synthesize_to_wav_bytes(self, text):
        """
        Synthesize complete audio and return as WAV bytes
        """
        self._load_model()

        # Generate all chunks
        all_audio = []
        for chunk_data in self.synthesize_streaming(text):
            all_audio.append(chunk_data['audio'])

        # Concatenate all audio
        full_audio = np.concatenate(all_audio)

        # Convert to WAV bytes
        wav_buffer = io.BytesIO()
        write(wav_buffer, self.hps.data.sampling_rate, full_audio)
        wav_buffer.seek(0)

        return wav_buffer.read()


# CLI interface
def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python mt_litetts_streaming.py <text> [output.wav] [--stream]'
        }))
        sys.exit(1)

    text = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "./audio_streaming.wav"
    stream_mode = '--stream' in sys.argv

    try:
        import time
        start_time = time.time()

        tts = MTLiteTTSStreaming()

        if stream_mode:
            # Stream mode: save chunks separately
            print(json.dumps({
                'success': True,
                'mode': 'streaming',
                'message': 'Streaming chunks...'
            }))

            for chunk_data in tts.synthesize_streaming(text):
                chunk_output = f"chunk_{chunk_data['chunk_index']}.wav"
                write(
                    chunk_output,
                    chunk_data['sample_rate'],
                    chunk_data['audio']
                )
                print(json.dumps({
                    'chunk': chunk_data['chunk_index'],
                    'total': chunk_data['total_chunks'],
                    'text': chunk_data['text'],
                    'file': chunk_output
                }), file=sys.stderr)
        else:
            # Normal mode: complete synthesis
            wav_bytes = tts.synthesize_to_wav_bytes(text)

            with open(output_path, 'wb') as f:
                f.write(wav_bytes)

            processing_time = time.time() - start_time

            print(json.dumps({
                'success': True,
                'audio_path': output_path,
                'file_size': len(wav_bytes),
                'text_length': len(text),
                'voice': '程小可 (Cheng Xiaoke)',
                'model': 'mt_litetts_v4d',
                'processing_time': processing_time,
                'mode': 'complete'
            }))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
