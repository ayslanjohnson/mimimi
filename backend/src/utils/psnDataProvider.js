import axios from 'axios';
import { config } from '../config/environment.js';

export class PSNDataProvider {
  static async getProfileData(psnId) {
    try {
      const response = await axios.get(
        `${config.psnApiBase}/v2/profiles/${psnId}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar perfil ${psnId}:`, error.message);
      throw error;
    }
  }

  static async getGamesData(psnId) {
    try {
      const response = await axios.get(
        `${config.psnApiBase}/v2/profiles/${psnId}/trophies`,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar jogos do perfil ${psnId}:`, error.message);
      return { trophies: [] };
    }
  }
}
