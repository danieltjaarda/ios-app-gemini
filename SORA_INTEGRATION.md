# Sora 2 Video Generation - Integratie Gids

Deze gids legt uit hoe je de Sora 2 API gebruikt voor video generatie in je iOS app.

## 🎬 Overzicht

Sora 2 is OpenAI's state-of-the-art video generatie model dat video's kan maken vanuit tekst of afbeeldingen. Het project ondersteunt nu zowel **image generation** (Gemini) als **video generation** (Sora 2).

## 📋 Prerequisites

1. **OpenAI API Key**: Je hebt een OpenAI API key nodig met toegang tot de Sora API
2. **Node.js 18+**: Voor de backend server
3. **React Native**: Voor de iOS app

## 🛠️ Backend Setup

### 1. Install Dependencies

De OpenAI SDK is al toegevoegd aan `package.json`. Installeer dependencies:

```bash
npm install
```

### 2. Configureer Environment Variables

Voeg je OpenAI API key toe aan je `.env` file:

```bash
PORT=3000
GOOGLE_APPLICATION_CREDENTIALS=./keys/vertex.json
PROJECT_ID=your_google_cloud_project_id
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Voor Render.com deployment:**
- Voeg `OPENAI_API_KEY` toe als environment variable in je Render dashboard
- Zorg dat de key begint met `sk-`

### 3. Start de Server

```bash
node index.js
```

Je zou moeten zien:
```
✅ Google Auth initialized successfully
✅ OpenAI client initialized for Sora
✅ Gemini backend running on http://localhost:3000
```

## 📡 API Endpoints

### POST /generate-video

Start een video generatie job.

**Request:**
```json
{
  "prompt": "Wide tracking shot of a teal coupe driving through a desert highway, heat ripples visible, hard sun overhead.",
  "model": "sora-2",
  "size": "1280x720",
  "seconds": 8,
  "image": "data:image/png;base64,..." // optioneel voor image-to-video
}
```

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "video_68d7512d07848190b3e45da0ecbebcde004da08e1e0678d5",
    "status": "queued",
    "model": "sora-2",
    "progress": 0,
    "seconds": "8",
    "size": "1280x720",
    "created_at": 1758941485
  },
  "prompt": "...",
  "model": "sora-2",
  "size": "1280x720",
  "seconds": 8,
  "type": "text-to-video"
}
```

**Parameters:**
- `prompt` (required): Beschrijving van de video
- `model` (optional): `sora-2` (fast) of `sora-2-pro` (high quality). Default: `sora-2`
- `size` (optional): Video resolutie. Opties: `1280x720`, `1920x1080`, `1080x1920`, `720x1280`. Default: `1280x720`
- `seconds` (optional): Video lengte in seconden (1-60). Default: `8`
- `image` (optional): Base64 image voor image-to-video generatie

### GET /video-status/:videoId

Check de status van een video generatie job.

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "video_abc123",
    "status": "in_progress",
    "model": "sora-2-pro",
    "progress": 33,
    "seconds": "8",
    "size": "1280x720",
    "created_at": 1758941485,
    "error": null
  }
}
```

**Status waarden:**
- `queued`: Job is in de wachtrij
- `in_progress`: Video wordt gegenereerd
- `completed`: Video is klaar
- `failed`: Generatie is mislukt

### GET /video-content/:videoId

Download de gegenereerde video (MP4), thumbnail, of spritesheet.

**Query Parameters:**
- `variant` (optional): `video` (default), `thumbnail`, of `spritesheet`

**Response:**
Binary video file (MP4) of image file (thumbnail/spritesheet)

## 📱 React Native Integratie

### 1. Gebruik de API Service

De `geminiApi` service bevat nu ook video generatie functies:

```javascript
import { geminiApi } from './src/services/geminiApi';
```

### 2. Text-to-Video Generatie

```javascript
const generateVideo = async () => {
  try {
    // Start video generation
    const result = await geminiApi.generateVideo(
      "A video of a cool cat on a motorcycle in the night",
      {
        model: 'sora-2', // of 'sora-2-pro' voor hogere kwaliteit
        size: '1280x720',
        seconds: 8,
      }
    );

    const videoId = result.video.id;
    console.log('Video generation started:', videoId);

    // Poll voor status updates
    const finalResult = await geminiApi.pollVideoStatus(
      videoId,
      (progress) => {
        console.log(`Progress: ${progress.progress}% - Status: ${progress.status}`);
        // Update UI met progress
      }
    );

    // Download video wanneer klaar
    if (finalResult.video.status === 'completed') {
      const videoContent = await geminiApi.downloadVideoContent(videoId);
      
      // Gebruik de URL in React Native Video component
      setVideoUrl(videoContent.url);
    }
  } catch (error) {
    console.error('Video generation failed:', error);
  }
};
```

### 3. Image-to-Video Generatie

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const transformImageToVideo = async () => {
  // Kies een image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled && result.assets[0]) {
    const imageUri = result.assets[0].uri;
    
    // Converteer image naar base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const imageBase64 = `data:image/jpeg;base64,${base64}`;

    // Start video generation met image
    const result = await geminiApi.transformVideo(
      'She turns around and smiles, then slowly walks out of the frame.',
      imageBase64,
      {
        model: 'sora-2-pro',
        size: '1280x720',
        seconds: 8,
      }
    );

    // Poll en download zoals hierboven
    // ...
  }
};
```

### 4. Video Weergave in React Native

Installeer `react-native-video`:

```bash
npm install react-native-video
# of
yarn add react-native-video
```

Gebruik in je component:

```javascript
import Video from 'react-native-video';

// In je component:
<Video
  source={{ uri: videoUrl }}
  style={styles.video}
  controls={true}
  resizeMode="contain"
  onError={(error) => console.error('Video error:', error)}
/>
```

### 5. Volledig Voorbeeld Component

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { geminiApi } from './src/services/geminiApi';

const VideoGeneratorScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setVideoUrl(null);
    setProgress(0);
    setStatus('Starting...');

    try {
      // Start video generation
      const result = await geminiApi.generateVideo(prompt, {
        model: 'sora-2',
        size: '1280x720',
        seconds: 8,
      });

      const videoId = result.video.id;
      setStatus('Generating video...');

      // Poll for status
      const finalResult = await geminiApi.pollVideoStatus(
        videoId,
        (progressData) => {
          setProgress(progressData.progress);
          setStatus(`Generating... ${progressData.progress}%`);
        }
      );

      if (finalResult.video.status === 'completed') {
        setStatus('Downloading video...');
        const videoContent = await geminiApi.downloadVideoContent(videoId);
        setVideoUrl(videoContent.url);
        setStatus('Video ready!');
      } else {
        throw new Error('Video generation failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate video');
      setStatus('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Generator</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your video prompt..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={4}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGenerateVideo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate Video</Text>
        )}
      </TouchableOpacity>

      {status && (
        <Text style={styles.status}>{status}</Text>
      )}

      {progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}

      {videoUrl && (
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          controls={true}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#202223',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e1e3e5',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#202223',
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
});

export default VideoGeneratorScreen;
```

## 🎯 Best Practices

### 1. Effectieve Prompts

Voor beste resultaten, beschrijf:
- **Shot type**: Wide shot, close-up, tracking shot, etc.
- **Subject**: Wat is het hoofdonderwerp?
- **Action**: Wat gebeurt er?
- **Setting**: Waar speelt het zich af?
- **Lighting**: Wat voor licht is er?

**Voorbeeld:**
```
"Wide shot of a child flying a red kite in a grassy park, golden hour sunlight, camera slowly pans upward."
```

### 2. Model Keuze

- **sora-2**: Sneller, goed voor iteratie en concepten
- **sora-2-pro**: Hogere kwaliteit, voor productie content

### 3. Polling Strategie

- Poll elke 5-10 seconden
- Gebruik exponential backoff bij errors
- Toon progress aan gebruikers
- Timeout na max 5-10 minuten

### 4. Error Handling

```javascript
try {
  const result = await geminiApi.generateVideo(prompt);
  // ...
} catch (error) {
  if (error.response?.status === 400) {
    // Invalid request
    Alert.alert('Invalid Request', error.response.data.error);
  } else if (error.response?.status === 429) {
    // Rate limit
    Alert.alert('Too Many Requests', 'Please try again later');
  } else {
    // Other error
    Alert.alert('Error', 'Failed to generate video');
  }
}
```

## 🔒 Security

- **API Key**: Nooit in client code. Alleen op de server.
- **HTTPS**: Gebruik altijd HTTPS in productie
- **Rate Limiting**: Server heeft rate limiting (100 requests/minuut)
- **Input Validation**: Valideer prompts voordat je ze verstuurt

## 🐛 Troubleshooting

### "OpenAI client not initialized"
- Zorg dat `OPENAI_API_KEY` is ingesteld in environment variables
- Check dat de key begint met `sk-`
- Herstart de server na het toevoegen van de key

### "Video generation failed"
- Check OpenAI API status
- Verify dat je account toegang heeft tot Sora API
- Check billing/credits op OpenAI account

### Video niet afspelen in React Native
- Zorg dat `react-native-video` correct is geïnstalleerd
- Check dat de URL correct is (moet beginnen met `http://` of `https://`)
- Voor iOS: check Info.plist voor network permissions

### Timeout errors
- Video generatie kan 2-5 minuten duren
- Verhoog timeout in axios config indien nodig
- Gebruik polling in plaats van direct downloaden

## 📚 Meer Informatie

- [OpenAI Sora Documentation](https://platform.openai.com/docs/guides/video)
- [Sora Prompting Guide](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)
- [React Native Video](https://github.com/TheWidlarzGroup/react-native-video)

## 💡 Tips

1. **Start met korte video's** (5-8 seconden) voor snellere feedback
2. **Gebruik sora-2** voor iteratie, **sora-2-pro** voor finale versies
3. **Cache video URLs** lokaal om herhaalde downloads te voorkomen
4. **Toon loading states** duidelijk aan gebruikers (kan lang duren)
5. **Gebruik thumbnails** voor previews in lijsten

