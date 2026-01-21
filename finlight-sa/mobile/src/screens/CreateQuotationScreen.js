import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function CreateQuotationScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: 0.15 }],
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      await Promise.all([loadCustomers(), loadProducts(), loadCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data.items);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: 0.15 },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const selectProduct = (index) => {
    setSelectedItemIndex(index);
    setShowProductSelector(true);
  };

  const onProductSelected = (product) => {
    if (selectedItemIndex !== null && product) {
      const newItems = [...formData.items];
      const unitPrice = typeof product.unitPrice === 'number' 
        ? product.unitPrice 
        : parseFloat(product.unitPrice) || 0;
      
      newItems[selectedItemIndex] = {
        ...newItems[selectedItemIndex],
        productId: product.id || '',
        description: product.name || '',
        unitPrice: unitPrice.toString(),
        vatRate: 0.15,
      };
      setFormData({ ...formData, items: newItems });
    }
    setShowProductSelector(false);
    setSelectedItemIndex(null);
  };

  const getProductsByCategory = useMemo(() => {
    const categorized = {};
    products.forEach(product => {
      let categoryName = null;
      if (product.productCategory?.name) {
        categoryName = product.productCategory.name;
      } else if (product.productCategoryId && categories.length > 0) {
        const foundCategory = categories.find(c => c.id === product.productCategoryId);
        categoryName = foundCategory?.name;
      }
      categoryName = categoryName || t('products.uncategorized');
      if (!categorized[categoryName]) {
        categorized[categoryName] = [];
      }
      categorized[categoryName].push(product);
    });
    return categorized;
  }, [products, categories, t]);

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const vat = subtotal * item.vatRate;
      return total + subtotal + vat;
    }, 0);
  };

  const handleSave = async () => {
    if (!formData.customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].description) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/quotations', {
        customerId: formData.customerId,
        items: formData.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          vatRate: parseFloat(item.vatRate),
        })),
        issueDate: new Date(formData.issueDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        notes: formData.notes,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Quotation created successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create quotation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Customer *</Text>
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
            selectedValue={formData.customerId}
            onValueChange={(value) => setFormData({ ...formData, customerId: value })}
            style={{ color: theme.colors.text }}
          >
            <Picker.Item label="Select customer" value="" />
            {customers.map((customer) => (
              <Picker.Item key={customer.id} label={customer.name} value={customer.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Issue Date</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={formData.issueDate}
              onChangeText={(text) => setFormData({ ...formData, issueDate: text })}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Expiry Date</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={formData.expiryDate}
              onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Items</Text>

        {formData.items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.itemNumber, { color: theme.colors.text }]}>
                Item {index + 1}
              </Text>
              {formData.items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Text style={{ color: theme.colors.error }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.descriptionRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="Description"
                placeholderTextColor={theme.colors.placeholder}
                value={item.description}
                onChangeText={(text) => updateItem(index, 'description', text)}
              />
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => selectProduct(index)}
              >
                <Text style={styles.selectButtonText}>Select Product</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Quantity
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="1"
                  placeholderTextColor={theme.colors.placeholder}
                  value={String(item.quantity)}
                  onChangeText={(text) => updateItem(index, 'quantity', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Unit Price
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={String(item.unitPrice)}
                  onChangeText={(text) => updateItem(index, 'unitPrice', text)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={[styles.lineTotal, { color: theme.colors.text }]}>
              Subtotal: R {(item.quantity * item.unitPrice).toFixed(2)}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { borderColor: theme.colors.primary }]}
          onPress={addItem}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add Item</Text>
        </TouchableOpacity>

        <View style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total (incl. VAT):
          </Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            R {calculateTotal().toFixed(2)}
          </Text>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Notes</Text>
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
          placeholder="Additional notes (optional)"
          placeholderTextColor={theme.colors.placeholder}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Quotation</Text>
          )}
        </TouchableOpacity>

        <Modal
          visible={showProductSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowProductSelector(false);
            setSelectedItemIndex(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Product
              </Text>

              <ScrollView style={styles.productList}>
                {Object.entries(getProductsByCategory).map(([categoryName, categoryProducts]) => (
                  <View key={categoryName} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                      {categoryName}
                    </Text>
                    {categoryProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productOption,
                          { borderColor: theme.colors.border },
                        ]}
                        onPress={() => onProductSelected(product)}
                      >
                        <View style={styles.productInfo}>
                          <Text style={[styles.productName, { color: theme.colors.text }]}>
                            {product.name}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>
                            R {product.unitPrice.toFixed(2)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => {
                  setShowProductSelector(false);
                  setSelectedItemIndex(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionRow: {
    marginBottom: 12,
  },
  descriptionInput: {
    marginBottom: 8,
  },
  selectButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  addButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  totalCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  productList: {
    maxHeight: 400,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  productOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

