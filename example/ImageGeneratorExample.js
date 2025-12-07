import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { geminiApi } from '../src/services/geminiApi';

const ImageGeneratorExample = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('unknown');

  const aspectRatios = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '16:9 (Landscape)', value: '16:9' },
    { label: '9:16 (Portrait)', value: '9:16' },
    { label: '4:3 (Classic)', value: '4:3' },
    { label: '3:4 (Portrait Classic)', value: '3:4' },
  ];

  // Check server health on mount
  React.useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const health = await geminiApi.checkHealth();
      setServerStatus('online');
      console.log('Server health:', health);
    } catch (error) {
      setServerStatus('offline');
      console.error('Server health check failed:', error);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await geminiApi.generateImage(prompt.trim(), aspectRatio);
      
      if (result.success && result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0]);
        Alert.alert('Success', 'Image generated successfully!');
      } else {
        throw new Error('No images returned from server');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🎨 Image Generator</Text>
        
        {/* Server Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            serverStatus === 'online' ? styles.statusOnline : styles.statusOffline
          ]} />
          <Text style={styles.statusText}>
            Server: {serverStatus === 'online' ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Prompt Input */}
        <Text style={styles.label}>Prompt:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., a futuristic fatbike on the beach"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        {/* Aspect Ratio Selector */}
        <Text style={styles.label}>Aspect Ratio:</Text>
        <View style={styles.aspectRatioContainer}>
          {aspectRatios.map((ratio) => (
            <TouchableOpacity
              key={ratio.value}
              style={[
                styles.aspectRatioButton,
                aspectRatio === ratio.value && styles.aspectRatioButtonActive
              ]}
              onPress={() => setAspectRatio(ratio.value)}
              disabled={loading}
            >
              <Text style={[
                styles.aspectRatioText,
                aspectRatio === ratio.value && styles.aspectRatioTextActive
              ]}>
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Image</Text>
          )}
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {/* Generated Image */}
        {generatedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>Generated Image:</Text>
            <Image
              source={{ uri: generatedImage }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 20,
    color: '#202223',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e3e5',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#008060',
  },
  statusOffline: {
    backgroundColor: '#bf0711',
  },
  statusText: {
    fontSize: 14,
    color: '#202223',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#202223',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c9cccf',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#202223',
  },
  aspectRatioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  aspectRatioButton: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c9cccf',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  aspectRatioButtonActive: {
    backgroundColor: '#202223',
    borderColor: '#202223',
  },
  aspectRatioText: {
    fontSize: 12,
    color: '#202223',
  },
  aspectRatioTextActive: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#202223',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bf0711',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#bf0711',
    fontSize: 14,
  },
  imageContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e3e5',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    color: '#202223',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 6,
  },
});

export default ImageGeneratorExample;

