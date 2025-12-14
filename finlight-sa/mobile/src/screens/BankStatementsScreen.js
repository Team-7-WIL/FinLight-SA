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
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function BankStatementsScreen({ navigation }) {
  const [bankStatements, setBankStatements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadBankStatements();
    }, [])
  );

  const loadBankStatements = async () => {
    try {
      const response = await apiClient.get('/bankstatements');
      if (response.data.success) {
        setBankStatements(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading bank statements:', error);
      Alert.alert(t('common.error'), t('messages.failedToLoad') + ' ' + t('titles.bankStatements').toLowerCase());
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await uploadBankStatement(result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(t('common.error'), t('messages.failedToPickDocument'));
    }
  };

  const uploadBankStatement = async (document) => {
    setIsUploading(true);
    try {
      console.log('Starting bank statement upload...');

      if (!document.uri) {
        console.error('No document URI provided');
        Alert.alert(t('common.error'), t('messages.noFileSelected'));
        setIsUploading(false);
        return;
      }

      console.log('Document details:', {
        uri: document.uri,
        name: document.name,
        mimeType: document.mimeType,
        size: document.size,
      });

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Web: fetch the file as blob and append to FormData
        const response = await fetch(document.uri);
        const blob = await response.blob();
        formData.append('file', blob, document.name || `bank_statement_${Date.now()}.pdf`);
      } else {
        // Native: use uri, name, and type properties
        const fileToUpload = {
          uri: document.uri,
          name: document.name || `bank_statement_${Date.now()}.pdf`,
          type: document.mimeType || 'application/pdf',
        };
        formData.append('file', fileToUpload);
      }

      console.log('Uploading bank statement...');
      // axios will automatically set Content-Type with boundary for FormData
      const response = await apiClient.post('/bankstatements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Bank statement upload response:', response.data);

      if (response.data.success) {
        console.log('Upload successful, bank statement ID:', response.data.data.id);
        Alert.alert(t('common.success'), t('messages.bankStatementUploaded'));
        // Kick off processing immediately to create transactions
        try {
          console.log('Processing bank statement...');
          const processResponse = await apiClient.post(`/bankstatements/${response.data.data.id}/process`);
          console.log('Bank statement processed successfully:', processResponse.data);
          // Navigate to transactions so the user sees results
          navigation.navigate('BankTransactions');
        } catch (processError) {
          console.error('Error auto-processing bank statement:', processError);
          console.error('Process error details:', processError.response?.data);
          const processErrorMsg = processError.response?.data?.message || processError.message;
          Alert.alert(t('common.warning'), t('messages.bankStatementUploaded') + ' ' + (processErrorMsg || t('messages.failedToProcessStatement')));
        }
        loadBankStatements(); // Refresh the list
      } else {
        const errorMsg = response.data.message || t('messages.failedToUploadStatement');
        console.error('Bank statement upload failed:', errorMsg);
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (error) {
      console.error('Error uploading bank statement:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      const errorMessage = error.response?.data?.message || error.message || t('messages.failedToUploadStatement');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const processBankStatement = async (id) => {
    try {
      const response = await apiClient.post(`/bankstatements/${id}/process`);
      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.bankStatementProcessed'));
        loadBankStatements(); // Refresh the list
      } else {
        Alert.alert(t('common.error'), response.data.message || t('messages.failedToProcessStatement'));
      }
    } catch (error) {
      console.error('Error processing bank statement:', error);
      Alert.alert(t('common.error'), t('messages.failedToProcessStatement'));
    }
  };

  const deleteBankStatement = async (id) => {
    Alert.alert(
      t('common.delete') + ' ' + t('titles.bankStatements'),
      t('messages.deleteStatementConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/bankstatements/${id}`);
              if (response.data.success) {
                Alert.alert(t('common.success'), t('messages.bankStatementDeleted'));
                loadBankStatements(); // Refresh the list
              } else {
                Alert.alert(t('common.error'), response.data.message || t('messages.failedToDeleteStatement'));
              }
            } catch (error) {
              console.error('Error deleting bank statement:', error);
              Alert.alert(t('common.error'), t('messages.failedToDeleteStatement'));
            }
          },
        },
      ]
    );
  };

  const renderBankStatement = ({ item }) => (
    <View
      style={[
        styles.statementCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={styles.statementHeader}>
        <Text style={[styles.fileName, { color: theme.colors.text }]}>
          {item.fileName}
        </Text>
        <Text style={[styles.status, {
          color: item.status === 'Processed' ? theme.colors.success : theme.colors.warning
        }]}>
          {item.status === 'Processed' ? t('banking.processed') : t('banking.uploaded')}
        </Text>
      </View>

      <Text style={[styles.uploadDate, { color: theme.colors.textSecondary }]}>
        {t('banking.uploadedDate')}: {new Date(item.uploadDate).toLocaleDateString()}
      </Text>

      <Text style={[styles.transactionCount, { color: theme.colors.textSecondary }]}>
        {t('banking.transactionCount')}: {item.transactionCount}
      </Text>

      <View style={styles.actions}>
        {item.status === 'Uploaded' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => processBankStatement(item.id)}
          >
            <Text style={styles.actionButtonText}>{t('buttons.process')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => deleteBankStatement(item.id)}
        >
          <Text style={styles.actionButtonText}>{t('buttons.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        data={bankStatements}
        renderItem={renderBankStatement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('empty.noStatements')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {t('empty.uploadFirstStatement')}
            </Text>
          </View>
        }
      />

      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={[styles.uploadingContainer, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.uploadingText, { color: theme.colors.text }]}>
              {t('banking.uploading')}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadows.lg]}
        onPress={pickDocument}
        disabled={isUploading}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  statementCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  uploadDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
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
});
