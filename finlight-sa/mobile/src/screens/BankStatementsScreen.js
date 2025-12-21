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
      console.log('📁 Document picker opened...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      console.log('📁 Document picker result type:', result.type);
      console.log('📁 Document picker canceled:', result.canceled);
      console.log('📁 Document picker result:', result);

      // Handle web format: { canceled: false, assets: [...] }
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        console.log('✅ Document selected (web format), starting upload...');
        const webDocument = result.assets[0];
        await uploadBankStatement(webDocument);
      }
      // Handle native format: { type: 'success' }
      else if (result.type === 'success') {
        console.log('✅ Document selected (native format), starting upload...');
        await uploadBankStatement(result);
      } else if (result.canceled === true || result.type === 'cancel') {
        console.log('❌ Document picker cancelled by user');
      } else {
        console.log('⚠️ Document picker returned unexpected format:', result);
        Alert.alert(t('common.error'), t('messages.failedToPickDocument'));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(t('common.error'), t('messages.failedToPickDocument'));
    }
  };

  const uploadBankStatement = async (document) => {
    console.log('\n🚀 ===== UPLOAD START =====');
    console.log('Time:', new Date().toISOString());
    console.log('Document object keys:', Object.keys(document));
    setIsUploading(true);
    try {
      console.log('=== BANK STATEMENT UPLOAD STARTED ===');
      console.log('Starting bank statement upload...');

      // Handle both web and native formats
      const documentUri = document.uri || (document.blob ? URL.createObjectURL(document.blob) : null);
      const documentName = document.name || 'bank_statement.pdf';
      const documentMimeType = document.mimeType || 'application/octet-stream';
      const documentSize = document.size || 0;

      if (!documentUri) {
        console.error('❌ No document URI provided');
        Alert.alert(t('common.error'), t('messages.noFileSelected'));
        setIsUploading(false);
        return;
      }

      console.log('Document details:', {
        uri: documentUri,
        name: documentName,
        mimeType: documentMimeType,
        size: documentSize,
      });

      const formData = new FormData();
      
      // Determine MIME type
      const mimeType = documentMimeType || 'application/octet-stream';
      const fileName = documentName || `bank_statement_${Date.now()}.pdf`;

      if (Platform.OS === 'web') {
        // Web: fetch the file as blob and append to FormData
        try {
          const response = await fetch(documentUri);
          const blob = await response.blob();
          formData.append('file', blob, fileName);
          console.log('✅ Web FormData created with blob');
          console.log('📦 Blob size:', blob.size, 'bytes');
        } catch (fetchError) {
          console.error('❌ Error fetching file for web:', fetchError);
          throw new Error('Failed to fetch file');
        }
      } else {
        // Native: use uri, name, and type properties
        const fileToUpload = {
          uri: documentUri,
          name: fileName,
          type: mimeType,
        };
        formData.append('file', fileToUpload);
        console.log('✅ Native FormData created');
        console.log('📦 File details:', {
          uri: fileToUpload.uri,
          name: fileToUpload.name,
          type: fileToUpload.type,
          mimeType: documentMimeType,
        });
      }

      console.log('FormData ready, uploading to /bankstatements...');
      console.log('Making POST request to /bankstatements');
      console.log('FormData object:', formData);
      console.log('📤 Sending POST request to:', '/bankstatements');
      console.log('⏱️ Request timestamp:', new Date().toISOString());
      
      const response = await apiClient.post('/bankstatements', formData);
      
      console.log('📥 Response received');
      console.log('Bank statement upload response status:', response.status);
      console.log('Bank statement upload response data:', response.data);

      if (response.data.success) {
        console.log('✅ Upload successful, bank statement ID:', response.data.data.id);
        console.log('📊 Response data:', response.data.data);
        Alert.alert(t('common.success'), t('messages.bankStatementUploaded'));
        // Kick off processing immediately to create transactions
        try {
          console.log('🔄 Processing bank statement...');
          const processResponse = await apiClient.post(`/bankstatements/${response.data.data.id}/process`);
          console.log('✅ Bank statement processed successfully:', processResponse.data);
          // Navigate to transactions so the user sees results
          navigation.navigate('BankTransactions');
        } catch (processError) {
          console.error('❌ Error auto-processing bank statement:', processError);
          console.error('Process error details:', processError.response?.data);
          const processErrorMsg = processError.response?.data?.message || processError.message;
          Alert.alert(t('common.warning'), t('messages.bankStatementUploaded') + ' ' + (processErrorMsg || t('messages.failedToProcessStatement')));
        }
        loadBankStatements(); // Refresh the list
      } else {
        const errorMsg = response.data.message || t('messages.failedToUploadStatement');
        console.error('❌ Bank statement upload failed:', errorMsg);
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (error) {
      console.error('❌ Error uploading bank statement:', error.message);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        headers: error.config?.headers,
        url: error.config?.url,
        method: error.config?.method,
      });
      const errorMessage = error.response?.data?.message || error.message || t('messages.failedToUploadStatement');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      console.log('🏁 Upload process ended');
      console.log('⏱️ End timestamp:', new Date().toISOString());
      console.log('🚀 ===== UPLOAD END =====\n');
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
