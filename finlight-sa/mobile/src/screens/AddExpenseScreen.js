import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MediaType, launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

const CATEGORIES = [
  'Rent',
  'Utilities',
  'Fuel',
  'Transport',
  'Office Supplies',
  'Marketing',
  'Salaries',
  'Inventory',
  'Meals & Entertainment',
  'Professional Fees',
  'Insurance',
  'Maintenance',
  'Technology',
  'Bank Charges',
  'Taxes',
  'Other',
];

export default function AddExpenseScreen({ navigation }) {
  const [formData, setFormData] = useState({
    category: 'Other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
    receiptData: null, // Store base64 receipt data
    receiptFileName: null, // Store receipt filename
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  const handleScanReceipt = async () => {
    try {
      console.log('Starting receipt scan...');

      // Request camera permissions
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('messages.cameraPermissionNeeded'));
        return;
      }

      console.log('Opening image picker...');
      // Use image picker (works on both web and native)
      const result = await launchImageLibraryAsync({
        mediaTypes: [MediaType.IMAGE],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setIsLoading(true);

      // Process receipt with OCR
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Web: fetch the file as blob and append to FormData
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('Image', blob, asset.fileName || `receipt_${Date.now()}.jpg`);
      } else {
        // Native: use uri, name, and type properties
        const file = {
          uri: asset.uri,
          name: asset.fileName || `receipt_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        };
        formData.append('Image', file);
      }
      
      formData.append('AutoCategorize', 'true');

      console.log('Uploading receipt for OCR processing...');
      const response = await apiClient.post('/ocr/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('OCR response:', response.data);

      if (response.data.success && response.data.data) {
        const receiptData = response.data.data;
        console.log('Extracted receipt data:', receiptData);
        // Pre-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          vendor: receiptData.vendor || prev.vendor,
          amount: receiptData.amount ? receiptData.amount.toString() : prev.amount,
          date: receiptData.date ? new Date(receiptData.date).toISOString().split('T')[0] : prev.date,
        }));
        Alert.alert(t('common.success'), t('messages.receiptScanned'));
      } else {
        const errorMsg = response.data?.message || t('messages.failedToProcessReceipt');
        console.error('OCR processing failed:', errorMsg);
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      const errorMsg = error.response?.data?.message || error.message || t('messages.failedToProcessReceipt');
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert(t('common.error'), errorMsg);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSave = async () => {
    if (!formData.category || !formData.amount) {
      Alert.alert(t('common.error'), t('messages.fillRequiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        vendor: formData.vendor,
        notes: formData.notes,
        isRecurring: false,
      };

      const response = await apiClient.post('/expenses', expenseData);

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.expenseAdded'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      const errorMessage = error.response?.data?.message || error.message || t('messages.failedToAddExpense');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('expenses.category')} *
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: formData.category === cat
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setFormData({ ...formData, category: cat })}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: formData.category === cat
                      ? '#fff'
                      : theme.colors.text,
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('expenses.amount')} *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="0.00"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.amount}
          onChangeText={(text) => setFormData({ ...formData, amount: text })}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('expenses.vendor')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Vendor name"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.vendor}
          onChangeText={(text) => setFormData({ ...formData, vendor: text })}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('expenses.notes')}
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Additional notes"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[
            styles.button,
            styles.scanButton,
            { backgroundColor: theme.colors.secondary },
          ]}
          onPress={handleScanReceipt}
        >
          <Text style={styles.buttonText}>{t('buttons.scanReceipt')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('buttons.saveExpense')}</Text>
          )}
        </TouchableOpacity>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  scanButton: {
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});