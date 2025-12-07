# React Native iOS App - Server Integratie

## Server URL

Je Render server draait op: `https://gemini-backend-u5cj.onrender.com`

## API Endpoints

- **Health Check**: `GET https://gemini-backend-u5cj.onrender.com/health`
- **Image Generation**: `POST https://gemini-backend-u5cj.onrender.com/generate-image`

## React Native Integratie

### 1. Install Dependencies

```bash
npm install axios
# of
yarn add axios
```

### 2. Maak een API Service File

Maak een nieuw bestand: `src/services/geminiApi.js` (of `services/geminiApi.ts` voor TypeScript)

```javascript
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
```

### 3. Gebruik in je React Native Component

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { geminiApi } from './services/geminiApi';

const ImageGeneratorScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await geminiApi.generateImage(prompt, aspectRatio);
      
      if (result.success && result.images && result.images.length > 0) {
        // De eerste image gebruiken
        setGeneratedImage(result.images[0]);
        Alert.alert('Success', 'Image generated successfully!');
      } else {
        throw new Error('No images returned');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate image';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Generator</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your prompt..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <Button
        title={loading ? 'Generating...' : 'Generate Image'}
        onPress={handleGenerateImage}
        disabled={loading}
      />

      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      {error && (
        <Text style={styles.error}>Error: {error}</Text>
      )}

      {generatedImage && (
        <Image
          source={{ uri: generatedImage }}
          style={styles.image}
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
  loader: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: 300,
    marginTop: 20,
    borderRadius: 8,
  },
});

export default ImageGeneratorScreen;
```

### 4. Image-to-Image Voorbeeld

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const handleTransformImage = async () => {
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

    setLoading(true);
    try {
      const result = await geminiApi.transformImage(
        'make this image more colorful',
        imageBase64,
        '16:9'
      );
      
      if (result.success && result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0]);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }
};
```

## Environment Variables (Aanbevolen)

Maak een config file voor verschillende environments:

```javascript
// config/api.js
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000', // Voor lokale development
  },
  production: {
    baseURL: 'https://gemini-backend-u5cj.onrender.com',
  },
};

const env = __DEV__ ? 'development' : 'production';
export const API_BASE_URL = API_CONFIG[env].baseURL;
```

## Error Handling

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.error || 'Server error';
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable.';
      default:
        return message;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your internet connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};
```

## Security Best Practices

1. **Never expose API keys in client code** - Je credentials zijn al veilig op de server
2. **Use HTTPS** - Render gebruikt automatisch HTTPS
3. **Validate user input** - Valideer prompts voordat je ze naar de server stuurt
4. **Handle errors gracefully** - Toon gebruiksvriendelijke error messages
5. **Add rate limiting on client** - Voorkom te veel requests

## Testing

Test eerst de health endpoint:

```javascript
const testConnection = async () => {
  try {
    const health = await geminiApi.checkHealth();
    console.log('Server is online:', health);
    return true;
  } catch (error) {
    console.error('Server is offline:', error);
    return false;
  }
};
```

## Troubleshooting

### CORS Errors
- De server heeft CORS al geconfigureerd voor alle origins
- Als je nog steeds CORS errors krijgt, check de Render logs

### Network Timeout
- Image generation kan lang duren (30-60 seconden)
- De timeout is ingesteld op 60 seconden
- Overweeg een progress indicator toe te voegen

### Image Not Displaying
- Zorg dat de base64 string begint met `data:image/png;base64,` of `data:image/jpeg;base64,`
- Check of de image URI correct is geformatteerd

## Volledig Voorbeeld Component

Zie `example/ImageGeneratorExample.js` voor een volledig werkend voorbeeld.

