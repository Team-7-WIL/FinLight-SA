import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = Buffer;
}
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function QuotationDetailScreen({ navigation, route }) {
  const { quotationId } = route.params;
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useEffect(() => {
    loadQuotation();
  }, []);

  const loadQuotation = async () => {
    try {
      const response = await apiClient.get(`/quotations/${quotationId}`);
      if (response.data.success) {
        setQuotation(response.data.data);
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      Alert.alert(t('common.error'), t('messages.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await apiClient.get(`/quotations/${quotationId}/pdf`, {
        responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Quotation-${quotation.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        Alert.alert(t('common.success'), t('messages.pdfSaved'));
        return;
      }

      const fileUri = FileSystem.documentDirectory + `Quotation-${quotation.number}.pdf`;
      const base64Data = Buffer.from(response.data).toString('base64');

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(t('common.success'), t('messages.pdfSaved'));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert(t('common.error'), t('messages.failedToDownloadPdf'));
    }
  };

  const sendEmail = async () => {
    try {
      console.log('[sendEmail] Starting email send for quotation:', quotationId);
      console.log('[sendEmail] Using endpoint: /quotations/' + quotationId + '/send-email');
      
      const response = await apiClient.post(`/quotations/${quotationId}/send-email`, {});
      console.log('[sendEmail] Response received:', response.data);
      
      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.quotationEmailSent'));
        loadQuotation();
      } else {
        console.log('[sendEmail] API returned success=false:', response.data.message);
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToSendQuotationEmail'));
      }
    } catch (error) {
      console.error('[sendEmail] Error occurred:', error);
      console.error('[sendEmail] Error response:', error.response?.data);
      console.error('[sendEmail] Error status:', error.response?.status);
      console.error('[sendEmail] Error message:', error.message);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || error.message || t('messages.failedToSendQuotationEmail')
      );
    }
  };

  const performConversion = async () => {
    try {
      console.log('[convertToInvoice] Starting conversion for quotation:', quotationId);
      console.log('[convertToInvoice] Using endpoint: /quotations/' + quotationId + '/convert-to-invoice');

      const response = await apiClient.post(`/quotations/${quotationId}/convert-to-invoice`, {});
      console.log('[convertToInvoice] Response received:', response.data);

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.quotationConverted'));
        navigation.navigate('Invoices');
      } else {
        console.log('[convertToInvoice] API returned success=false:', response.data.message);
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToConvertQuotation'));
      }
    } catch (error) {
      console.error('[convertToInvoice] Error occurred:', error);
      console.error('[convertToInvoice] Error response:', error.response?.data);
      console.error('[convertToInvoice] Error status:', error.response?.status);
      console.error('[convertToInvoice] Error message:', error.message);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || error.message || t('messages.failedToConvertQuotation')
      );
    }
  };

  const convertToInvoice = () => {
    // On web, Alert buttons are not supported. Use window.confirm instead.
    if (Platform.OS === 'web') {
      const ok = window.confirm(
        t('messages.confirmConvertQuotation')
      );
      if (ok) {
        performConversion();
      }
      return;
    }

    Alert.alert(
      t('buttons.convertToInvoice'),
      t('messages.confirmConvertQuotation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('buttons.convert'), onPress: performConversion },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!quotation) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{t('quotations.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.quotationNumber, { color: theme.colors.text }]}>
            {quotation.number}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
              {quotation.status}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('quotations.customer')}
        </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{quotation.customer.name}</Text>
          {quotation.customer.email && (
            <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
              {quotation.customer.email}
            </Text>
          )}
        </View>

        <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('quotations.issueDate')}
        </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {quotation.issueDate ? new Date(quotation.issueDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('quotations.expiryDate')}
        </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('quotations.items')}
        </Text>
          {quotation.items && quotation.items.length > 0 ? quotation.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemDescription, { color: theme.colors.text }]}>
                  {item.description}
                </Text>
                <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                  {item.quantity} × R {item.unitPrice.toFixed(2)} (VAT {item.vatRate * 100}%)
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: theme.colors.text }]}>
                R {item.lineTotal.toFixed(2)}
              </Text>
            </View>
          )) : (
          <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
            {t('quotations.noItems')}
          </Text>
        )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
            {t('quotations.subtotal')}
          </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              R {quotation.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
            {t('quotations.vat')}
          </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              R {quotation.vatAmount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            {t('quotations.total')}
          </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              R {quotation.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {quotation.notes && (
          <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {t('quotations.notes')}
          </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{quotation.notes}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {quotation.status !== 'Converted' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={convertToInvoice}
            >
            <Text style={styles.actionButtonText}>
              {t('buttons.convertToInvoice')}
            </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={downloadPdf}
          >
          <Text style={styles.actionButtonText}>
            {t('buttons.pdf')}
          </Text>
          </TouchableOpacity>
          {quotation.customer.email && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
              onPress={sendEmail}
            >
            <Text style={styles.actionButtonText}>
              {t('buttons.email')}
            </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  quotationNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

