# Image Ophalen en Uploaden - React Native

## 1. Image Ophalen van API

### Basisvoorbeeld - Image ophalen en weergeven:

```javascript
import React, { useState } from 'react';
import { View, Image, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const API_URL = 'https://gemini-backend-u5cj.onrender.com';

const ImageGenerator = () => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchImage = async (prompt, aspectRatio = '16:9') => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/generate-image`, {
        prompt: prompt,
        aspectRatio: aspectRatio,
      });

      if (response.data.success && response.data.images && response.data.images.length > 0) {
        // De eerste image ophalen (base64 data URL)
        const base64Image = response.data.images[0];
        setImageUri(base64Image);
      } else {
        Alert.alert('Error', 'No image returned');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading && <ActivityIndicator size="large" />}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: 300 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};
```

## 2. Image Uploaden voor Image-to-Image

### Met React Native Image Picker:

```bash
npm install react-native-image-picker
# of
npm install expo-image-picker  # voor Expo
```

### Expo Image Picker Voorbeeld:

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const API_URL = 'https://gemini-backend-u5cj.onrender.com';

const ImageTransformer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [transformedImage, setTransformedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Image selecteren uit galerij
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Compressie voor kleinere bestanden
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Image omzetten naar base64 en uploaden
  const transformImage = async (prompt) => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      // Converteer image naar base64
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Bepaal MIME type
      const mimeType = selectedImage.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const imageBase64 = `data:${mimeType};base64,${base64}`;

      // Stuur naar API
      const response = await axios.post(`${API_URL}/generate-image`, {
        prompt: prompt,
        image: imageBase64,
        aspectRatio: '16:9',
      });

      if (response.data.success && response.data.images && response.data.images.length > 0) {
        setTransformedImage(response.data.images[0]);
        Alert.alert('Success', 'Image transformed!');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to transform image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Select Image Button */}
      <Button title="Select Image" onPress={pickImage} />
      
      {/* Selected Image Preview */}
      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          style={{ width: 200, height: 200 }}
        />
      )}

      {/* Transform Button */}
      <Button
        title="Transform Image"
        onPress={() => transformImage('make it more colorful')}
        disabled={!selectedImage || loading}
      />

      {/* Transformed Image */}
      {transformedImage && (
        <Image
          source={{ uri: transformedImage }}
          style={{ width: '100%', height: 300 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};
```

### React Native Image Picker (Bare React Native):

```javascript
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import axios from 'axios';

const pickAndTransformImage = async (prompt) => {
  // Image picker configuratie
  const options = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
  };

  launchImageLibrary(options, async (response) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    const imageUri = response.assets[0].uri;
    
    try {
      // Converteer naar base64
      const base64 = await RNFS.readFile(imageUri, 'base64');
      const mimeType = response.assets[0].type || 'image/jpeg';
      const imageBase64 = `data:${mimeType};base64,${base64}`;

      // Stuur naar API
      const apiResponse = await axios.post('https://gemini-backend-u5cj.onrender.com/generate-image', {
        prompt: prompt,
        image: imageBase64,
        aspectRatio: '16:9',
      });

      if (apiResponse.data.success && apiResponse.data.images) {
        return apiResponse.data.images[0];
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  });
};
```

## 3. Image Opslaan op Device

### Met Expo FileSystem:

```javascript
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

const saveImageToDevice = async (base64Image) => {
  try {
    // Vraag permissie
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to save images');
      return;
    }

    // Maak een bestandsnaam
    const filename = `generated_${Date.now()}.png`;
    const fileUri = FileSystem.documentDirectory + filename;

    // Converteer base64 naar file
    const base64Data = base64Image.split(',')[1]; // Verwijder data:image/png;base64,
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Sla op in media library
    await MediaLibrary.createAssetAsync(fileUri);
    Alert.alert('Success', 'Image saved to gallery!');
  } catch (error) {
    Alert.alert('Error', 'Failed to save image');
    console.error(error);
  }
};
```

### Met React Native FS (Bare React Native):

```javascript
import RNFS from 'react-native-fs';
import CameraRoll from '@react-native-community/cameraroll';

const saveImageToDevice = async (base64Image) => {
  try {
    // Vraag permissie
    const permission = await CameraRoll.requestPhotosPermission();
    if (!permission) {
      Alert.alert('Permission needed', 'We need access to save images');
      return;
    }

    // Maak bestandsnaam en pad
    const filename = `generated_${Date.now()}.png`;
    const filePath = `${RNFS.PictureDirectoryPath}/${filename}`;

    // Converteer base64 naar file
    const base64Data = base64Image.split(',')[1];
    await RNFS.writeFile(filePath, base64Data, 'base64');

    // Sla op in gallery
    await CameraRoll.save(filePath, { type: 'photo' });
    Alert.alert('Success', 'Image saved!');
  } catch (error) {
    Alert.alert('Error', 'Failed to save image');
    console.error(error);
  }
};
```

## 4. Complete Hook voor Image Handling

```javascript
import { useState } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = 'https://gemini-backend-u5cj.onrender.com';

export const useImageGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Text-to-Image
  const generateImage = async (prompt, aspectRatio = '16:9') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/generate-image`, {
        prompt,
        aspectRatio,
      });

      if (response.data.success && response.data.images?.length > 0) {
        return response.data.images[0];
      }
      throw new Error('No image returned');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Image-to-Image
  const transformImage = async (prompt, imageUri, aspectRatio = '16:9') => {
    setLoading(true);
    setError(null);

    try {
      // Converteer image naar base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const mimeType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const imageBase64 = `data:${mimeType};base64,${base64}`;

      // Stuur naar API
      const response = await axios.post(`${API_URL}/generate-image`, {
        prompt,
        image: imageBase64,
        aspectRatio,
      });

      if (response.data.success && response.data.images?.length > 0) {
        return response.data.images[0];
      }
      throw new Error('No image returned');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Image picken
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  };

  return {
    generateImage,
    transformImage,
    pickImage,
    loading,
    error,
  };
};
```

## 5. Gebruik in Component

```javascript
import React, { useState } from 'react';
import { View, Image, Button, TextInput, Alert } from 'react-native';
import { useImageGenerator } from './hooks/useImageGenerator';

const MyComponent = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const { generateImage, transformImage, pickImage, loading } = useImageGenerator();

  const handleGenerate = async () => {
    try {
      const imageUri = await generateImage(prompt, '16:9');
      setImage(imageUri);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTransform = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        const transformed = await transformImage('make it colorful', imageUri);
        setImage(transformed);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Enter prompt"
      />
      <Button title="Generate" onPress={handleGenerate} disabled={loading} />
      <Button title="Transform Image" onPress={handleTransform} disabled={loading} />
      {image && <Image source={{ uri: image }} style={{ width: 300, height: 300 }} />}
    </View>
  );
};
```

## 6. Image Compressie (Voor kleinere uploads)

```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (imageUri) => {
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }], // Resize naar max 1024px breedte
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  return manipulatedImage.uri;
};
```

## Belangrijke Tips:

1. **Base64 Images**: De API retourneert images als `data:image/png;base64,...` - deze kun je direct gebruiken in `<Image source={{ uri: base64Image }} />`

2. **Image Grootte**: Voor image-to-image, compress images eerst om upload tijd te verkorten

3. **Error Handling**: Check altijd of `response.data.success` true is en of `images` array niet leeg is

4. **Loading States**: Toon altijd een loading indicator tijdens API calls (kan 30-60 seconden duren)

5. **Network Timeout**: De API heeft een timeout van 60 seconden - zorg voor goede UX tijdens het wachten

