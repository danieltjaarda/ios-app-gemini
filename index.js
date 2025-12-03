require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ID = process.env.PROJECT_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './keys/vertex.json';

// Middleware
app.use(cors());
// Increase body size limit to 50MB for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Rate limiting placeholder (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per window

const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitStore.get(clientId);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.' 
    });
  }
  
  clientData.count++;
  next();
};

// Initialize Google Auth
let authClient = null;

async function initializeAuth() {
  try {
    // Check if credentials file exists
    const credentialsPath = path.resolve(CREDENTIALS_PATH);
    if (!fs.existsSync(credentialsPath)) {
      console.warn(`⚠️  Credentials file not found at: ${credentialsPath}`);
      console.warn('⚠️  Server will start but image generation will not work until credentials are added.');
      console.warn('⚠️  Please add your Google Cloud service account JSON file to: keys/vertex.json');
      return; // Don't throw, allow server to start
    }

    // Initialize Google Auth with service account
    authClient = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    console.log('✅ Google Auth initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Google Auth:', error.message);
    console.warn('⚠️  Server will start but image generation will not work.');
    // Don't throw, allow server to start
  }
}

// Get access token
async function getAccessToken() {
  try {
    if (!authClient) {
      await initializeAuth();
    }
    const client = await authClient.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error.message);
    throw error;
  }
}

// Generate image using Gemini API
// Supports both text-to-image and image-to-image generation
async function generateImage(prompt, aspectRatio = '1:1', inputImageBase64 = null) {
  try {
    const accessToken = await getAccessToken();
    
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID is not set in environment variables');
    }

    // Use Vertex AI endpoint with gemini-2.5-flash-image model
    // Vertex AI is the recommended way to use Gemini with service accounts
    const modelName = 'gemini-2.5-flash-image';
    const location = 'us-central1'; // or your preferred region
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${location}/publishers/google/models/${modelName}:generateContent`;
    
    // Construct the prompt with aspect ratio specification
    const fullPrompt = inputImageBase64 
      ? `Transform or modify this image based on the following description: ${prompt}. The output image should have an aspect ratio of ${aspectRatio}.`
      : `Generate an image with the following description: ${prompt}. The image should have an aspect ratio of ${aspectRatio}.`;
    
    // Build parts array - can include both image and text
    const parts = [];
    
    // Add input image if provided (for image-to-image)
    if (inputImageBase64) {
      // Extract base64 data and mime type from data URL if present
      let imageData = inputImageBase64;
      let mimeType = 'image/png';
      
      if (inputImageBase64.startsWith('data:')) {
        const matches = inputImageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageData = matches[2];
        } else {
          // Remove data URL prefix if present
          imageData = inputImageBase64.replace(/^data:[^;]+;base64,/, '');
        }
      }
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageData
        }
      });
    }
    
    // Add text prompt
    parts.push({
      text: fullPrompt
    });
    
    const requestBody = {
      contents: [{
        role: "user",
        parts: parts
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract base64 images from response
    const images = [];
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts || [];
      parts.forEach(part => {
        if (part.inlineData && part.inlineData.data) {
          images.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
        }
        // Some models might return image data in different formats
        if (part.image && part.image.data) {
          images.push(`data:${part.image.mimeType || 'image/png'};base64,${part.image.data}`);
        }
      });
    }

    // If no images in response, check if there's text that might indicate an error
    if (images.length === 0) {
      // Check if there's a text response that might explain the issue
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts || [];
        const textParts = parts.filter(p => p.text);
        if (textParts.length > 0) {
          console.warn('Received text response instead of image:', textParts[0].text);
        }
      }
      throw new Error('No images were generated. The model may not support image generation, or the response format is unexpected.');
    }

    return images;
  } catch (error) {
    console.error('Error generating image:', error.message);
    throw error;
  }
}

// Logging function placeholder (for future extension)
function logImageGeneration(userId, prompt, timestamp) {
  // Placeholder: Can be connected to database or logging service later
  console.log(`[LOG] Image Generation - User: ${userId || 'anonymous'}, Prompt: ${prompt}, Time: ${new Date(timestamp).toISOString()}`);
  // Future: await db.logs.insert({ userId, prompt, timestamp });
}

// POST /generate-image endpoint
// Supports both text-to-image and image-to-image generation
app.post('/generate-image', rateLimitMiddleware, async (req, res) => {
  try {
    const { prompt, aspectRatio, image } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid prompt. Please provide a valid prompt string.',
      });
    }

    // Validate aspect ratio if provided
    const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    const ratio = aspectRatio || '1:1';
    if (!validAspectRatios.includes(ratio)) {
      return res.status(400).json({
        error: `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`,
      });
    }

    // Validate image if provided (for image-to-image)
    let inputImageBase64 = null;
    if (image) {
      if (typeof image !== 'string') {
        return res.status(400).json({
          error: 'Invalid image format. Image must be a base64 string (data URL or base64).',
        });
      }
      inputImageBase64 = image;
    }

    // Log the request (placeholder for future extension)
    const userId = req.headers['x-user-id'] || 'anonymous';
    const timestamp = Date.now();
    const generationType = inputImageBase64 ? 'image-to-image' : 'text-to-image';
    logImageGeneration(userId, `${generationType}: ${prompt}`, timestamp);

    // Generate image (text-to-image or image-to-image)
    const images = await generateImage(prompt.trim(), ratio, inputImageBase64);

    // Return response
    res.json({
      success: true,
      images: images,
      prompt: prompt,
      aspectRatio: ratio,
      type: generationType,
    });
  } catch (error) {
    console.error('Error in /generate-image:', error.message);
    
    // Return appropriate error response
    if (error.message.includes('Credentials')) {
      return res.status(500).json({
        error: 'Server configuration error. Please contact support.',
      });
    }
    
    if (error.message.includes('API error')) {
      return res.status(502).json({
        error: 'Failed to generate image. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    res.status(500).json({
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Error handler for payload too large
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Image file is too large. Please use an image smaller than 50MB.',
      details: 'The uploaded image exceeds the maximum allowed size.'
    });
  }
  next(error);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'gemini-backend'
  });
});

// Serve test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
  try {
    // Initialize authentication
    await initializeAuth();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Gemini backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the server
startServer();

