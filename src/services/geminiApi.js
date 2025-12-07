import axios from 'axios';

// Je Render server URL
const API_BASE_URL = 'https://gemini-backend-u5cj.onrender.com';

// Maak een axios instance met default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconden timeout voor image generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service
export const geminiApi = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Text-to-Image generation
  generateImage: async (prompt, aspectRatio = '1:1') => {
    try {
      const response = await apiClient.post('/generate-image', {
        prompt: prompt,
        aspectRatio: aspectRatio,
      });
      return response.data;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  },

  // Image-to-Image generation
  transformImage: async (prompt, imageBase64, aspectRatio = '1:1') => {
    try {
      const response = await apiClient.post('/generate-image', {
        prompt: prompt,
        image: imageBase64, // Base64 data URL van de image
        aspectRatio: aspectRatio,
      });
      return response.data;
    } catch (error) {
      console.error('Image transformation failed:', error);
      throw error;
    }
  },
};

export default geminiApi;

