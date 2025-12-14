import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function ProcessReceiptResultScreen({ navigation, route }) {
  const { receiptData, imageUri } = route.params;
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await apiClient.get('/customers');
      if (response.data.success) {
        setCustomers(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const createInvoiceFromReceipt = async () => {
    if (!selectedCustomerId) {
      Alert.alert(t('common.error'), t('messages.selectCustomer'));
      return;
    }

    setIsCreating(true);
    try {
      const invoiceData = {
        customerId: selectedCustomerId,
        vendor: receiptData.vendor,
        amount: receiptData.amount,
        date: receiptData.date,
        vatAmount: receiptData.vatAmount || 0,
        items: receiptData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        notes: `Created from OCR - ${receiptData.vendor}`,
      };

      const response = await apiClient.post('/ocr/create-invoice-from-receipt', invoiceData);

      if (response.data.success) {
        Alert.alert(
          t('common.success'),
          t('messages.invoiceCreatedFromReceipt'),
          [
            {
              text: t('buttons.viewInvoice'),
              onPress: () => {
                navigation.popToTop();
                navigation.navigate('Invoices');
              }
            },
            {
              text: t('buttons.ok'),
              onPress: () => navigation.popToTop()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert(t('common.error'), t('messages.failedToCreateInvoice'));
    } finally {
      setIsCreating(false);
    }
  };

  const renderReceiptData = () => (
    <View style={[styles.dataCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('ocr.extractedData')}
      </Text>

      <View style={styles.dataRow}>
        <Text style={[styles.dataLabel, { color: theme.colors.textSecondary }]}>
          {t('ocr.vendor')}:
        </Text>
        <Text style={[styles.dataValue, { color: theme.colors.text }]}>
          {receiptData.vendor || t('ocr.unknownVendor')}
        </Text>
      </View>

      <View style={styles.dataRow}>
        <Text style={[styles.dataLabel, { color: theme.colors.textSecondary }]}>
          {t('ocr.amount')}:
        </Text>
        <Text style={[styles.dataValue, { color: theme.colors.text }]}>
          R {receiptData.amount?.toFixed(2) || '0.00'}
        </Text>
      </View>

      <View style={styles.dataRow}>
        <Text style={[styles.dataLabel, { color: theme.colors.textSecondary }]}>
          {t('ocr.date')}:
        </Text>
        <Text style={[styles.dataValue, { color: theme.colors.text }]}>
          {receiptData.date || t('ocr.unknownDate')}
        </Text>
      </View>

      {receiptData.vatAmount > 0 && (
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: theme.colors.textSecondary }]}>
            {t('ocr.vatAmount')}:
          </Text>
          <Text style={[styles.dataValue, { color: theme.colors.text }]}>
            R {receiptData.vatAmount.toFixed(2)}
          </Text>
        </View>
      )}

      {receiptData.items && receiptData.items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>
            {t('ocr.items')}:
          </Text>
          {receiptData.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.itemDescription, { color: theme.colors.text }]}>
                {item.description}
              </Text>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                {item.quantity}x @ R{item.unitPrice?.toFixed(2)} = R{item.total?.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('ocr.receiptProcessed')}
        </Text>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.receiptImage} />
        )}

        {renderReceiptData()}

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('ocr.createInvoice')}
        </Text>

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('customers.selectCustomer')} *
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Picker
            selectedValue={selectedCustomerId}
            onValueChange={(value) => setSelectedCustomerId(value)}
            style={{ color: theme.colors.text }}
          >
            <Picker.Item label={t('customers.selectCustomer')} value="" />
            {customers.map((customer) => (
              <Picker.Item key={customer.id} label={customer.name} value={customer.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={createInvoiceFromReceipt}
          disabled={isCreating || !selectedCustomerId}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>{t('ocr.createInvoice')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.colors.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.secondary }]}>
            {t('buttons.cancel')}
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  dataCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});