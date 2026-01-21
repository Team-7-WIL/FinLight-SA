import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
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

export default function QuotationsScreen({ navigation }) {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadQuotations();
    }, [])
  );

  const loadQuotations = async () => {
    try {
      const response = await apiClient.get('/quotations');
      if (response.data.success) {
        setQuotations(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted':
        return theme.colors.success;
      case 'Sent':
        return theme.colors.info;
      case 'Expired':
      case 'Rejected':
        return theme.colors.error;
      case 'Converted':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const downloadQuotationPdf = async (quotationId, quotationNumber) => {
    try {
      const response = await apiClient.get(`/quotations/${quotationId}/pdf`, {
        responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Quotation-${quotationNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        Alert.alert(t('common.success'), t('messages.pdfSaved'));
        return;
      }

      const fileUri = FileSystem.documentDirectory + `Quotation-${quotationNumber}.pdf`;
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

  const sendQuotationEmail = async (quotationId) => {
    try {
      const response = await apiClient.post(`/quotations/${quotationId}/send-email`);
      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.quotationEmailSent'));
        loadQuotations();
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToSendQuotationEmail'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('messages.failedToSendQuotationEmail')
      );
    }
  };

  const performConversion = async (quotationId) => {
    try {
      console.log('[convertToInvoice:list] Starting conversion for quotation:', quotationId);
      const response = await apiClient.post(`/quotations/${quotationId}/convert-to-invoice`);
      console.log('[convertToInvoice:list] Response:', response.data);
      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.quotationConverted'));
        navigation.navigate('Invoices');
        loadQuotations();
      } else {
        Alert.alert(
          t('common.error'),
          response.data.message || t('messages.failedToConvertQuotation')
        );
      }
    } catch (error) {
      console.error('Error converting:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('messages.failedToConvertQuotation')
      );
    }
  };

  const convertToInvoice = (quotationId) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(
        t('messages.confirmConvertQuotation')
      );
      if (ok) {
        performConversion(quotationId);
      }
      return;
    }

    Alert.alert(
      t('buttons.convertToInvoice'),
      t('messages.confirmConvertQuotation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('buttons.convert'), onPress: () => performConversion(quotationId) },
      ]
    );
  };

  const updateQuotationStatus = async (quotationId, newStatus) => {
    try {
      const response = await apiClient.put(`/quotations/${quotationId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.quotationStatusUpdated'));
        setShowStatusModal(false);
        setSelectedQuotation(null);
        loadQuotations();
      } else {
        Alert.alert(
          t('common.error'),
          response.data.message || t('messages.failedToUpdateQuotationStatus')
        );
      }
    } catch (error) {
      console.error('Error updating quotation status:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('messages.failedToUpdateQuotationStatus')
      );
    }
  };

  const handleStatusChange = (newStatus) => {
    if (selectedQuotation) {
      updateQuotationStatus(selectedQuotation.id, newStatus);
    }
  };

  const statusOptions = [
    { value: 'Draft', label: t('quotations.statusDraft') },
    { value: 'Sent', label: t('quotations.statusSent') },
    { value: 'Accepted', label: t('quotations.statusAccepted') },
    { value: 'Rejected', label: t('quotations.statusRejected') },
    { value: 'Expired', label: t('quotations.statusExpired') },
  ];

  const renderQuotation = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.quotationCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
      onPress={() => navigation.navigate('QuotationDetail', { quotationId: item.id })}
    >
      <View style={styles.quotationHeader}>
        <Text style={[styles.quotationNumber, { color: theme.colors.text }]}>
          {item.number}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedQuotation(item);
            setShowStatusModal(true);
          }}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status} ▼
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text style={[styles.customerName, { color: theme.colors.textSecondary }]}>
        {item.customer.name}
      </Text>
      <View style={styles.quotationFooter}>
        <Text style={[styles.amount, { color: theme.colors.text }]}>
          R {item.total.toFixed(2)}
        </Text>
        {item.expiryDate && (
          <Text style={[styles.expiryDate, { color: theme.colors.textSecondary }]}>
            {t('quotations.expiresOn', {
              date: new Date(item.expiryDate).toLocaleDateString(),
            })}
          </Text>
        )}
      </View>

      <View style={styles.quotationActions}>
        {item.status !== 'Converted' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => convertToInvoice(item.id)}
          >
              <Text style={styles.actionButtonText}>
                {t('buttons.convert')}
              </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => downloadQuotationPdf(item.id, item.number)}
        >
            <Text style={styles.actionButtonText}>
              {t('buttons.pdf')}
            </Text>
        </TouchableOpacity>
        {item.customer.email && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
            onPress={() => sendQuotationEmail(item.id)}
          >
              <Text style={styles.actionButtonText}>
                {t('buttons.email')}
              </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={quotations}
        renderItem={renderQuotation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('quotations.empty')}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
        onPress={() => navigation.navigate('CreateQuotation')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowStatusModal(false);
          setSelectedQuotation(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('quotations.updateStatusTitle')}
            </Text>
            {selectedQuotation && (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  {selectedQuotation.number}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('quotations.currentStatusLabel', {
                    status: selectedQuotation.status,
                  })}
                </Text>
                <View style={styles.statusOptions}>
                  {statusOptions.map((statusObj) => (
                    <TouchableOpacity
                      key={statusObj.value}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor:
                            selectedQuotation.status === statusObj.value
                              ? theme.colors.primary
                              : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => handleStatusChange(statusObj.value)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          {
                            color:
                              selectedQuotation.status === statusObj.value
                                ? '#fff'
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {statusObj.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => {
                setShowStatusModal(false);
                setSelectedQuotation(null);
              }}
            >
              <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  list: {
    padding: 16,
  },
  quotationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotationNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 14,
    marginBottom: 12,
  },
  quotationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expiryDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  quotationActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statusOptions: {
    marginVertical: 16,
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

