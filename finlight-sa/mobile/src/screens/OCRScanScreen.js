import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
// Conditionally import Camera only for native platforms
let Camera = null;
let CameraConstants = null;
if (Platform.OS !== 'web') {
  try {
    const cameraModule = require('expo-camera');
    Camera = cameraModule.Camera;
    CameraConstants = cameraModule;
  } catch (e) {
    console.warn('expo-camera not available, OCR will use gallery only');
    Camera = null;
    CameraConstants = null;
  }
}
import * as ImagePicker from 'expo-image-picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function OCRScanScreen({ navigation, route }) {
  const { documentType = 'receipt' } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(CameraConstants?.Type?.back || 'back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  React.useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // Camera not available on web, skip permission check
        setHasPermission(false);
        return;
      }
      if (Camera?.requestCameraPermissionsAsync) {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.warn('Camera permission error:', error);
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && Camera) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setSelectedImage(photo.uri);
        setShowCamera(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(t('common.error'), t('messages.cameraError'));
      }
    } else {
      Alert.alert(t('common.error'), t('messages.cameraNotAvailable'));
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('messages.imagePickerError'));
    }
  };

  const processDocument = async () => {
    if (!selectedImage) {
      Alert.alert(t('common.error'), t('messages.selectImageFirst'));
      return;
    }

    setIsProcessing(true);
    try {
      // Convert image to form data
      const formData = new FormData();

      // Get file info
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const fileName = selectedImage.split('/').pop();
      const file = {
        uri: selectedImage,
        name: fileName,
        type: 'image/jpeg',
      };

      if (documentType === 'receipt') {
        formData.append('Image', file);
        formData.append('AutoCategorize', 'true');

        const result = await apiClient.post('/ocr/process-receipt', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (result.data.success) {
          navigation.navigate('ProcessReceiptResult', {
            receiptData: result.data.data,
            imageUri: selectedImage
          });
        }
      } else {
        formData.append('Image', file);
        formData.append('AutoProcess', 'true');

        const result = await apiClient.post('/ocr/process-invoice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (result.data.success) {
          Alert.alert(t('common.success'), t('messages.invoiceProcessed'));
          // Could navigate to invoice creation with processed data
        }
      }
    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert(t('common.error'), t('messages.processingFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permissionText, { color: theme.colors.text }]}>
          {t('messages.cameraPermissionRequired')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {documentType === 'receipt' ? t('ocr.scanReceipt') : t('ocr.scanInvoice')}
        </Text>

        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {documentType === 'receipt'
            ? t('ocr.receiptDescription')
            : t('ocr.invoiceDescription')
          }
        </Text>

        {!selectedImage && !showCamera && (
          <View style={styles.optionsContainer}>
            {Platform.OS !== 'web' && Camera && (
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowCamera(true)}
              >
                <Text style={styles.optionButtonText}>{t('ocr.takePhoto')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.secondary }]}
              onPress={pickImage}
            >
              <Text style={[styles.optionButtonText, { color: theme.colors.text }]}>
                {t('ocr.chooseFromGallery')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showCamera && Camera && (
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={cameraType}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => setShowCamera(false)}
                >
                  <Text style={styles.cameraButtonText}>{t('buttons.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.captureButton, { backgroundColor: theme.colors.primary }]}
                  onPress={takePicture}
                >
                  <Text style={styles.captureButtonText}>{t('ocr.capture')}</Text>
                </TouchableOpacity>
              </View>
            </Camera>
          </View>
        )}

        {selectedImage && !showCamera && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.actionButtonText}>{t('buttons.retake')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={processDocument}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {documentType === 'receipt' ? t('ocr.processReceipt') : t('ocr.processInvoice')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 400,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  cameraButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});