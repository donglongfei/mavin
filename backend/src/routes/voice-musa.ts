import { Router } from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger.js';
import { funASR } from '../services/FunASRService.js';

const execAsync = promisify(exec);
const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  dest: '/tmp/mavin-uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
});

// Paths to Python scripts
const BACKEND_DIR = process.cwd();
const PYTHON_DIR = path.join(BACKEND_DIR, 'python');
const TTS_SCRIPT = path.join(PYTHON_DIR, 'mt_litetts.py');

/**
 * POST /api/voice/asr
 * Speech-to-Text using FunASR Docker Container (port 10095)
 */
router.post('/asr', upload.single('audio'), async (req, res) => {
  let tempFile: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    tempFile = req.file.path;
    logger.info(`ASR request: ${req.file.originalname} (${req.file.size} bytes)`);

    // Use FunASR Docker service
    const result = await funASR.transcribe(tempFile);

    res.json({
      success: true,
      text: result.text,
      language: result.language,
      device: result.device,
      processing_time: result.processingTime,
      confidence: result.confidence,
    });

  } catch (error: any) {
    logger.error('ASR error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
});

/**
 * POST /api/voice/tts
 * Text-to-Speech using MT LiteTTS
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, backend = 'mt' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 5000 characters)',
      });
    }

    logger.info(`TTS request: "${text.substring(0, 50)}..." (${text.length} chars)`);

    // Generate unique filename
    const tempFilename = `tts_${nanoid()}_temp.wav`;
    const filename = `tts_${nanoid()}.wav`;
    const tempOutputPath = path.join(process.cwd(), 'public', 'audio', tempFilename);
    const outputPath = path.join(process.cwd(), 'public', 'audio', filename);

    // Ensure audio directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Call MT LiteTTS Python script
    const { stdout } = await execAsync(
      `python3 "${TTS_SCRIPT}" "${text.replace(/"/g, '\\"')}" "${tempOutputPath}" auto`
    );

    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(result.error || 'TTS failed');
    }

    // Convert IEEE Float WAV to PCM WAV for browser compatibility
    await execAsync(
      `ffmpeg -i "${tempOutputPath}" -acodec pcm_s16le -ar 22050 -ac 1 -y "${outputPath}"`
    );

    // Delete temp file
    try {
      await fs.unlink(tempOutputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    res.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      audioPath: result.audio_path,
      device: result.device,
      processing_time: result.processing_time,
      file_size: result.file_size,
    });

  } catch (error: any) {
    logger.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/voice/status
 * Get voice service status
 */
router.get('/status', async (req, res) => {
  try {
    // Re-check FunASR availability (don't rely on cached status)
    await funASR.initialize();
    const asrAvailable = funASR.isAvailable();

    // Check TTS script
    const ttsAvailable = await fs.access(TTS_SCRIPT).then(() => true).catch(() => false);

    res.json({
      success: true,
      asr: {
        available: asrAvailable,
        service: 'FunASR Docker (wss://localhost:10095)',
      },
      tts: {
        available: ttsAvailable,
        service: 'MT-LiteTTS Python',
        script: TTS_SCRIPT,
      },
    });
  } catch (error: any) {
    logger.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
