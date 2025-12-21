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

// Ensure Buffer is available in React Native / web environments
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = Buffer;
}
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function InvoicesScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
    loadInvoices();
    }, [])
  );

  const loadInvoices = async () => {
    try {
      const response = await apiClient.get('/invoices');
      if (response.data.success) {
        setInvoices(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return theme.colors.success;
      case 'Sent':
        return theme.colors.info;
      case 'Overdue':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const downloadInvoicePdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
        responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
      });

      if (Platform.OS === 'web') {
        // Web: create object URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        Alert.alert(t('common.success'), t('messages.pdfSaved'));
        return;
      }

      const fileUri = FileSystem.documentDirectory + `Invoice-${invoiceNumber}.pdf`;

      // Convert arraybuffer to base64 (native)
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

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const response = await apiClient.put(`/invoices/${invoiceId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.invoiceStatusUpdated'));
        setShowStatusModal(false);
        setSelectedInvoice(null);
        loadInvoices();
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToUpdateStatus'));
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('messages.failedToUpdateStatus'));
    }
  };

  const handleStatusChange = (newStatus) => {
    if (selectedInvoice) {
      updateInvoiceStatus(selectedInvoice.id, newStatus);
    }
  };

  const statusOptions = [
    { value: 'Draft', label: t('invoices.draft') },
    { value: 'Sent', label: t('invoices.sent') },
    { value: 'Paid', label: t('invoices.paid') },
    { value: 'Overdue', label: t('invoices.overdue') }
  ];

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.invoiceCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
      onPress={() => {
        setSelectedInvoice(item);
        setShowStatusModal(true);
      }}
    >
      <View style={styles.invoiceHeader}>
        <Text style={[styles.invoiceNumber, { color: theme.colors.text }]}>
          {item.number}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedInvoice(item);
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
      <View style={styles.invoiceFooter}>
        <Text style={[styles.amount, { color: theme.colors.text }]}>
          R {item.total.toFixed(2)}
        </Text>
        {item.dueDate && (
          <Text style={[styles.dueDate, { color: theme.colors.textSecondary }]}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => downloadInvoicePdf(item.id, item.number)}
        >
          <Text style={styles.actionButtonText}>{t('buttons.pdf')}</Text>
        </TouchableOpacity>
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
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('empty.noInvoices')}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
        onPress={() => navigation.navigate('CreateInvoice')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowStatusModal(false);
          setSelectedInvoice(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Update Invoice Status
            </Text>
            {selectedInvoice && (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  {selectedInvoice.number}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  Current: {selectedInvoice.status}
                </Text>
                <View style={styles.statusOptions}>
                  {statusOptions.map((statusObj) => (
                    <TouchableOpacity
                      key={statusObj.value}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor:
                            selectedInvoice.status === statusObj.value
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
                              selectedInvoice.status === statusObj.value
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
                setSelectedInvoice(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
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
  invoiceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
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
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dueDate: {
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
  invoiceActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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