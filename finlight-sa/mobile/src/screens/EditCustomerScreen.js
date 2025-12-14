import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function EditCustomerScreen({ navigation, route }) {
  const { customer } = route.params;
  const [formData, setFormData] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    vatNumber: customer.vatNumber || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert(t('common.error'), t('messages.customerNameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/customers/${customer.id}`, formData);

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.customerUpdated'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('messages.failedToUpdateCustomer'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('customers.name')} *
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
          placeholder={t('customers.name')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('customers.email')}
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
          placeholder="email@example.com"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('customers.phone')}
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
          placeholder={t('auth.phone')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('customers.address')}
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
          placeholder={t('customers.address')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          VAT Number
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
          placeholder="VAT number (optional)"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.vatNumber}
          onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('buttons.updateCustomer')}</Text>
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
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

