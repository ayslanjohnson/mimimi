import express from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = express.Router();
const healthController = new HealthController();

router.get('/', healthController.getHealth.bind(healthController));

export default router;