# Cursor Prompt voor React Native iOS App

## Project Setup Prompt

Je bent een expert React Native iOS developer. Bouw een React Native iOS app die verbinding maakt met een Gemini image generation backend API.

## Backend Server Details

**Server URL:** `https://gemini-backend-u5cj.onrender.com`

**API Endpoints:**
- Health Check: `GET /health`
- Image Generation: `POST /generate-image`

**Request Body voor `/generate-image`:**
```json
{
  "prompt": "a futuristic fatbike on the beach",
  "aspectRatio": "16:9",
  "image": "data:image/png;base64,..." // optioneel voor image-to-image
}
```

**Response:**
```json
{
  "success": true,
  "images": ["data:image/png;base64,..."],
  "prompt": "a futuristic fatbike on the beach",
  "aspectRatio": "16:9",
  "type": "text-to-image" // of "image-to-image"
}
```

## App Requirements

### Core Features:
1. **Text-to-Image Generation**
   - Text input field voor prompts
   - Aspect ratio selector (1:1, 16:9, 9:16, 4:3, 3:4)
   - Generate button
   - Display gegenereerde images

2. **Image-to-Image Transformation** (optioneel)
   - Image picker om een image te selecteren
   - Transform button met prompt
   - Display getransformeerde image

3. **UI/UX Requirements:**
   - Modern, clean design (Shopify-achtig, minimal, geen felle kleuren)
   - Wit/grijs kleurenschema
   - Veel witruimte
   - Subtiele borders en shadows
   - Loading states tijdens image generation
   - Error handling met duidelijke messages
   - Server status indicator

4. **Technical Requirements:**
   - React Native (Expo of bare React Native)
   - Axios voor API calls
   - TypeScript (optioneel maar aanbevolen)
   - Proper error handling
   - Network timeout handling (60 seconden)
   - Image caching voor betere performance

### API Service Structure:

Maak een `src/services/geminiApi.js` file met:

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://gemini-backend-u5cj.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const geminiApi = {
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  generateImage: async (prompt, aspectRatio = '1:1') => {
    const response = await apiClient.post('/generate-image', {
      prompt: prompt,
      aspectRatio: aspectRatio,
    });
    return response.data;
  },

  transformImage: async (prompt, imageBase64, aspectRatio = '1:1') => {
    const response = await apiClient.post('/generate-image', {
      prompt: prompt,
      image: imageBase64,
      aspectRatio: aspectRatio,
    });
    return response.data;
  },
};
```

### UI Components Needed:

1. **Main Screen:**
   - Header met app title
   - Server status indicator
   - Prompt input (multiline text input)
   - Aspect ratio selector (buttons of picker)
   - Generate button
   - Loading indicator
   - Error message display
   - Generated image display

2. **Styling:**
   - Use Shopify-inspired design system
   - Colors: #ffffff, #f6f6f7, #e1e3e5, #c9cccf, #202223, #6d7175
   - Buttons: Black (#202223) on white background
   - Borders: 1px solid #e1e3e5
   - Border radius: 6px
   - Typography: System fonts, clean and readable

### Error Handling:

Handle de volgende errors gracefully:
- Network errors (geen internet, server offline)
- API errors (400, 429, 500, 502)
- Timeout errors (image generation duurt te lang)
- Invalid responses

Toon gebruiksvriendelijke error messages in het Nederlands of Engels.

### Additional Features (Nice to Have):

- Image history/saved images
- Share functionaliteit
- Download images to device
- Multiple aspect ratio preview
- Image quality settings
- Retry mechanism bij failures

## Project Structure:

```
src/
  ├── services/
  │   └── geminiApi.js
  ├── components/
  │   ├── ImageGenerator.js
  │   ├── ImageDisplay.js
  │   └── StatusIndicator.js
  ├── screens/
  │   └── HomeScreen.js
  ├── styles/
  │   └── theme.js
  └── utils/
      └── errorHandler.js
```

## Implementation Steps:

1. Setup React Native project (Expo of bare)
2. Install dependencies (axios, react-native-image-picker voor image-to-image)
3. Create API service layer
4. Build UI components met Shopify-achtig design
5. Implement error handling
6. Add loading states
7. Test met de backend server
8. Polish UI/UX

## Testing:

Test de app met:
- Text-to-image generation
- Verschillende aspect ratios
- Error scenarios (server offline, invalid prompts)
- Network timeout handling

## Notes:

- De backend server heeft CORS al geconfigureerd
- Image generation kan 30-60 seconden duren
- Images worden geretourneerd als base64 data URLs
- Server health endpoint: `/health` voor status checks

---

**Start met het bouwen van een moderne, gebruiksvriendelijke React Native iOS app die naadloos integreert met de Gemini backend API.**

