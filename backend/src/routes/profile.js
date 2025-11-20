import express from 'express';
import { ProfileController } from '../controllers/profileController.js';

const router = express.Router();
const profileController = new ProfileController();

// Rotas de perfil
router.get('/:onlineId', profileController.getProfile.bind(profileController));
router.get('/:onlineId/games', profileController.getGames.bind(profileController));
router.get('/:onlineId/status', profileController.getAuthStatus.bind(profileController));

// Nova rota para verificar existência do usuário
router.get('/:onlineId/check', profileController.checkUserExists.bind(profileController));

export default router;