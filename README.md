# Gemini Backend Server

A secure Node.js Express backend for a React Native iOS app that integrates with Google Gemini API for image generation.

## 🚀 Features

- **Image Generation**: POST endpoint to generate images using Google Gemini API
- **Secure Authentication**: Uses Google Cloud service account credentials
- **CORS Enabled**: Configured for React Native app access
- **Rate Limiting**: Built-in rate limiting middleware (placeholder for future enhancement)
- **Error Handling**: Comprehensive error handling and validation
- **Production Ready**: Works locally and on cloud platforms (Render.com, Google Cloud Run)

## 📋 Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Gemini API enabled
- Service account credentials JSON file

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `google-auth-library` - Google authentication
- `node-fetch` - HTTP client
- `dotenv` - Environment variable management
- `cors` - CORS middleware

### 2. Configure Google Cloud

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gemini API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Generative Language API" or "Vertex AI API"
   - Enable the API for your project

3. **Create Service Account**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "gemini-backend")
   - Grant it the role: "Vertex AI User" or "AI Platform User"
   - Create and download the JSON key file

4. **Save Credentials**
   - Create a `keys` directory in the project root
   - Place your service account JSON file in `keys/vertex.json`

### 3. Configure Environment Variables

1. Copy the `.env` file and update it with your values:

```bash
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=./keys/vertex.json
PROJECT_ID=your_actual_project_id
```

2. Replace `your_actual_project_id` with your Google Cloud Project ID (found in Google Cloud Console)

### 4. Run the Server

```bash
node index.js
```

You should see:
```
✅ Google Auth initialized successfully
✅ Gemini backend running on http://localhost:3000
```

## 📡 API Endpoints

### POST /generate-image

Generate an image using Gemini API.

**Request:**
```json
{
  "prompt": "a futuristic fatbike on the beach",
  "aspectRatio": "16:9"
}
```

**Response (Success):**
```json
{
  "success": true,
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANS..."
  ],
  "prompt": "a futuristic fatbike on the beach",
  "aspectRatio": "16:9"
}
```

**Response (Error):**
```json
{
  "error": "Missing or invalid prompt. Please provide a valid prompt string."
}
```

**Aspect Ratios Supported:**
- `1:1` (default)
- `16:9`
- `9:16`
- `4:3`
- `3:4`

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "gemini-backend"
}
```

## 🔒 Security

- **Service Account Credentials**: Never exposed to frontend, stored securely in `keys/` directory
- **CORS**: Configured to allow requests from React Native app
- **Rate Limiting**: Basic rate limiting (100 requests per minute per IP)
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Errors are handled gracefully without exposing sensitive information

## 🚢 Deployment

### Deploy to Render.com

1. **Create a new Web Service** on Render.com
2. **Connect your repository** or use manual deploy
3. **Set Environment Variables** in Render dashboard:
   - `PORT` (Render will set this automatically, but you can override)
   - `GOOGLE_APPLICATION_CREDENTIALS=./keys/vertex.json`
   - `PROJECT_ID=your_project_id`
4. **Add Build Command**: `npm install`
5. **Add Start Command**: `node index.js`
6. **Upload Service Account File**:
   - Use Render's environment file upload feature, OR
   - Add the JSON content as a secret environment variable and write it to `keys/vertex.json` in a startup script

### Deploy to Google Cloud Run

1. **Create a Dockerfile** (optional, Cloud Run can use source-based deployment)
2. **Deploy using gcloud CLI**:
   ```bash
   gcloud run deploy gemini-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --set-env-vars "PROJECT_ID=your_project_id,GOOGLE_APPLICATION_CREDENTIALS=/tmp/vertex.json" \
     --set-secrets "GOOGLE_APPLICATION_CREDENTIALS=vertex-credentials:latest"
   ```

3. **Or use Google Cloud Console**:
   - Go to Cloud Run
   - Create new service
   - Upload source code
   - Set environment variables
   - Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `PORT` (usually set automatically by platform)
- `PROJECT_ID` (your Google Cloud project ID)
- `GOOGLE_APPLICATION_CREDENTIALS` (path to credentials file)
- `NODE_ENV=production` (optional, for production error handling)

## 🧪 Testing

### Using cURL

```bash
curl -X POST http://localhost:3000/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a beautiful sunset over mountains", "aspectRatio": "16:9"}'
```

### Using Postman

1. Create a new POST request
2. URL: `http://localhost:3000/generate-image`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "prompt": "a beautiful sunset over mountains",
     "aspectRatio": "16:9"
   }
   ```

## 📝 Notes

- **Model**: Currently configured for `gemini-2.0-flash-exp`. Update the model name in `index.js` if you need to use a different Gemini model.
- **Image Generation**: The Gemini API structure may vary. If image generation doesn't work as expected, you may need to adjust the API endpoint or use a different Gemini model that supports image generation.
- **Logging**: The `logImageGeneration` function is a placeholder for future database integration.
- **Rate Limiting**: Current implementation uses in-memory storage. For production, consider using Redis or a database-backed solution.

## 🐛 Troubleshooting

### "Credentials file not found"
- Ensure `keys/vertex.json` exists and contains valid service account credentials
- Check that `GOOGLE_APPLICATION_CREDENTIALS` in `.env` points to the correct path

### "PROJECT_ID is not set"
- Make sure `PROJECT_ID` is set in your `.env` file
- Verify it matches your Google Cloud project ID

### "Gemini API error"
- Verify Gemini API is enabled in your Google Cloud project
- Check that your service account has the necessary permissions
- Ensure you have billing enabled (Gemini API may require it)

### CORS errors from React Native app
- Verify the server URL is correct
- Check that CORS middleware is properly configured
- Ensure the server is accessible from your device/emulator

## 📄 License

ISC

## 🤝 Support

For issues or questions, please check:
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)

