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

// Axios instance voor video downloads (langer timeout)
const videoClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minuten timeout voor video downloads
  responseType: 'blob', // Voor binary data (video)
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

  // ==================== SORA VIDEO GENERATION ====================

  // Text-to-Video generation
  generateVideo: async (prompt, options = {}) => {
    try {
      const {
        model = 'sora-2', // 'sora-2' of 'sora-2-pro'
        size = '1280x720', // '1280x720', '1920x1080', '1080x1920', '720x1280'
        seconds = 8, // 1-60
        image = null, // Base64 image voor image-to-video (optioneel)
      } = options;

      const response = await apiClient.post('/generate-video', {
        prompt: prompt,
        model: model,
        size: size,
        seconds: seconds,
        image: image, // Optioneel voor image-to-video
      });
      return response.data;
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  },

  // Image-to-Video generation
  transformVideo: async (prompt, imageBase64, options = {}) => {
    try {
      const {
        model = 'sora-2',
        size = '1280x720',
        seconds = 8,
      } = options;

      const response = await apiClient.post('/generate-video', {
        prompt: prompt,
        model: model,
        size: size,
        seconds: seconds,
        image: imageBase64, // Base64 data URL van de image
      });
      return response.data;
    } catch (error) {
      console.error('Video transformation failed:', error);
      throw error;
    }
  },

  // Get video status
  getVideoStatus: async (videoId) => {
    try {
      const response = await apiClient.get(`/video-status/${videoId}`);
      return response.data;
    } catch (error) {
      console.error('Get video status failed:', error);
      throw error;
    }
  },

  // Poll video status until completed (with progress callback)
  pollVideoStatus: async (videoId, onProgress = null, maxAttempts = 60, interval = 5000) => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await geminiApi.getVideoStatus(videoId);
        const video = result.video;
        
        // Call progress callback if provided
        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            status: video.status,
            progress: video.progress || 0,
            video: video,
          });
        }
        
        // Check if completed or failed
        if (video.status === 'completed') {
          return result;
        }
        
        if (video.status === 'failed') {
          throw new Error(video.error?.message || 'Video generation failed');
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        // If error is not a status check error, throw it
        if (error.response?.status !== 400) {
          throw error;
        }
        // Otherwise continue polling
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      }
    }
    
    throw new Error('Video generation timeout. Maximum polling attempts reached.');
  },

  // Download video content
  // Returns a URL that can be used directly in React Native Video component
  downloadVideoContent: async (videoId, variant = 'video') => {
    try {
      // First check if video is completed
      const statusResult = await geminiApi.getVideoStatus(videoId);
      
      if (statusResult.video.status !== 'completed') {
        throw new Error(`Video is not ready yet. Current status: ${statusResult.video.status}`);
      }

      // For React Native, return the URL directly
      // The server will stream the video
      const videoUrl = `${API_BASE_URL}/video-content/${videoId}?variant=${variant}`;
      
      return {
        url: videoUrl,
        videoId: videoId,
        variant: variant,
        // Note: For React Native Video component, use the URL directly
        // Example: <Video source={{ uri: result.url }} />
      };
    } catch (error) {
      console.error('Download video content failed:', error);
      throw error;
    }
  },
};

export default geminiApi;

