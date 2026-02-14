import express from 'express';
import { serviceManager } from '../services/ServiceManager.js';

const router = express.Router();

/**
 * Get overall system health
 */
router.get('/health', async (req, res) => {
  try {
    const health = serviceManager.getSystemHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get system health',
      message: error.message,
    });
  }
});

/**
 * Get all service statuses
 */
router.get('/', async (req, res) => {
  try {
    const services = serviceManager.getAllServices();
    res.json({
      success: true,
      services,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get specific service status
 */
router.get('/:name', async (req, res) => {
  try {
    const service = serviceManager.getServiceStatus(req.params.name);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: `Service '${req.params.name}' not found`,
      });
    }

    res.json({
      success: true,
      service,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Restart a service
 */
router.post('/:name/restart', async (req, res) => {
  try {
    const { name } = req.params;

    await serviceManager.restartService(name);

    const service = serviceManager.getServiceStatus(name);

    res.json({
      success: true,
      message: `Service '${name}' restarted`,
      service,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get service logs
 */
router.get('/:name/logs', async (req, res) => {
  try {
    const { name } = req.params;
    const count = parseInt(req.query.count as string) || 100;

    const logs = serviceManager.getServiceLogs(name, count);

    res.json({
      success: true,
      service: name,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get all logs
 */
router.get('/logs/all', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 200;

    const logs = serviceManager.getLogs(count);

    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Clear logs
 */
router.delete('/logs', async (req, res) => {
  try {
    serviceManager.clearLogs();

    res.json({
      success: true,
      message: 'Logs cleared',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
