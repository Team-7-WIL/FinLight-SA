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
import { Picker } from '@react-native-picker/picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function EditProductScreen({ navigation, route }) {
  const { product } = route.params;
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    unitPrice: product.unitPrice?.toString() || '',
    isService: product.isService || false,
    sku: product.sku || '',
    productCategoryId: product.productCategoryId || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/productcategories');
      if (response.data.success) {
        setCategories(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t('common.error'), t('messages.productNameRequired'));
      return;
    }

    if (!formData.unitPrice || isNaN(parseFloat(formData.unitPrice))) {
      Alert.alert(t('common.error'), t('messages.validPriceRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        unitPrice: parseFloat(formData.unitPrice),
        isService: formData.isService,
        sku: formData.sku.trim(),
        productCategoryId: formData.productCategoryId || null,
      };

      const response = await apiClient.put(`/products/${product.id}`, productData);

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.productUpdated'));
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('messages.failedToUpdateProduct'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('common.confirm'),
      t('messages.confirmDeleteProduct'),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/products/${product.id}`);
              if (response.data.success) {
                Alert.alert(t('common.success'), t('messages.productDeleted'));
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('messages.failedToDeleteProduct'));
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.name')} *
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
          placeholder={t('products.namePlaceholder')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.category')}
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
            selectedValue={formData.productCategoryId}
            onValueChange={(value) => setFormData({ ...formData, productCategoryId: value })}
            style={{ color: theme.colors.text }}
          >
            <Picker.Item label={t('products.selectCategory')} value="" />
            {categories.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.id} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.description')}
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
          placeholder={t('products.descriptionPlaceholder')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.price')} *
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
          value={formData.unitPrice}
          onChangeText={(text) => setFormData({ ...formData, unitPrice: text })}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.sku')}
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
          placeholder={t('products.skuPlaceholder')}
          placeholderTextColor={theme.colors.placeholder}
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('products.type')}
        </Text>
        <View style={styles.typeOptions}>
          <TouchableOpacity
            style={[
              styles.typeOption,
              {
                backgroundColor: !formData.isService ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setFormData({ ...formData, isService: false })}
          >
            <Text
              style={[
                styles.typeOptionText,
                {
                  color: !formData.isService ? '#fff' : theme.colors.text,
                },
              ]}
            >
              {t('products.product')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeOption,
              {
                backgroundColor: formData.isService ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setFormData({ ...formData, isService: true })}
          >
            <Text
              style={[
                styles.typeOptionText,
                {
                  color: formData.isService ? '#fff' : theme.colors.text,
                },
              ]}
            >
              {t('products.service')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('buttons.save')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
          >
            <Text style={[styles.buttonText, { color: theme.colors.error }]}>
              {t('buttons.delete')}
            </Text>
          </TouchableOpacity>
        </View>
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
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flex: 2,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});