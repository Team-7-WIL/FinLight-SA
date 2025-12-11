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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import useThemeStore from '../store/useThemeStore';
import { useLanguage } from '../contexts/LanguageContext';
import apiClient from '../config/api';

export default function CreateInvoiceScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: 0.15 }],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useThemeStore();
  const { t } = useLanguage();

  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadCategories();
    loadTemplates();
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
    if (selectedItemIndex !== null) {
      updateItem(selectedItemIndex, 'productId', product.id);
      updateItem(selectedItemIndex, 'description', product.name);
      updateItem(selectedItemIndex, 'unitPrice', product.unitPrice.toString());
      updateItem(selectedItemIndex, 'vatRate', 0.15); // Default VAT rate
    }
    setShowProductSelector(false);
    setSelectedItemIndex(null);
  };

  const getProductsByCategory = () => {
    const categorized = {};
    products.forEach(product => {
      const categoryName = product.productCategory?.name || 'Uncategorized';
      if (!categorized[categoryName]) {
        categorized[categoryName] = [];
      }
      categorized[categoryName].push(product);
    });
    return categorized;
  };

  const loadTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem('invoiceTemplates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert(t('common.error'), t('messages.templateNameRequired'));
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: templateName.trim(),
      items: formData.items,
      notes: formData.notes,
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    await AsyncStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
    setTemplateName('');
    Alert.alert(t('common.success'), t('messages.templateSaved'));
  };

  const loadTemplate = (template) => {
    setFormData({
      ...formData,
      items: template.items,
      notes: template.notes || '',
    });
    setShowTemplates(false);
  };

  const deleteTemplate = async (templateId) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    await AsyncStorage.setItem('invoiceTemplates', JSON.stringify(updatedTemplates));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const vat = subtotal * item.vatRate;
      return total + subtotal + vat;
    }, 0);
  };

  const handleSave = async () => {
    if (!formData.customerId) {
      Alert.alert(t('common.error'), t('messages.selectCustomer'));
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].description) {
      Alert.alert(t('common.error'), t('messages.addAtLeastOneItem'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/invoices', {
        customerId: formData.customerId,
        items: formData.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          vatRate: parseFloat(item.vatRate),
        })),
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        notes: formData.notes,
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('messages.invoiceCreated'));
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('messages.failedToCreateInvoice'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={[styles.templateButton, { backgroundColor: theme.colors.info }]}
            onPress={() => setShowTemplates(true)}
          >
            <Text style={styles.templateButtonText}>{t('templates.loadTemplate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.templateButton, { backgroundColor: theme.colors.success }]}
            onPress={saveTemplate}
          >
            <Text style={styles.templateButtonText}>{t('templates.saveTemplate')}</Text>
          </TouchableOpacity>
        </View>

        {templateName !== '' && (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={t('templates.templateName')}
            placeholderTextColor={theme.colors.placeholder}
            value={templateName}
            onChangeText={setTemplateName}
          />
        )}

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Customer *
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

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Items
        </Text>

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
                <Text style={styles.selectButtonText}>{t('buttons.selectProduct')}</Text>
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
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
            + Add Item
          </Text>
        </TouchableOpacity>

        <View style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total (incl. VAT):
          </Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            R {calculateTotal().toFixed(2)}
          </Text>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Notes
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
            <Text style={styles.buttonText}>Create Invoice</Text>
          )}
        </TouchableOpacity>

        {/* Product Selector Modal */}
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
                {t('products.selectProduct')}
              </Text>

              <ScrollView style={styles.productList}>
                {Object.entries(getProductsByCategory()).map(([categoryName, categoryProducts]) => (
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
                        <Text style={[styles.productType, { color: theme.colors.textSecondary }]}>
                          {product.isService ? t('products.service') : t('products.product')}
                        </Text>
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
                <Text style={styles.modalButtonText}>{t('buttons.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Templates Modal */}
        <Modal
          visible={showTemplates}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTemplates(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('templates.selectTemplate')}
              </Text>

              <ScrollView style={styles.templateList}>
                {templates.length === 0 ? (
                  <Text style={[styles.emptyTemplates, { color: theme.colors.textSecondary }]}>
                    {t('templates.noTemplates')}
                  </Text>
                ) : (
                  templates.map((template) => (
                    <View key={template.id} style={styles.templateItem}>
                      <TouchableOpacity
                        style={styles.templateContent}
                        onPress={() => loadTemplate(template)}
                      >
                        <Text style={[styles.templateName, { color: theme.colors.text }]}>
                          {template.name}
                        </Text>
                        <Text style={[styles.templateDetails, { color: theme.colors.textSecondary }]}>
                          {template.items.length} {t('templates.items')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteTemplate, { borderColor: theme.colors.error }]}
                        onPress={() => {
                          Alert.alert(
                            t('common.confirm'),
                            t('messages.confirmDeleteTemplate'),
                            [
                              { text: t('buttons.cancel'), style: 'cancel' },
                              {
                                text: t('buttons.delete'),
                                style: 'destructive',
                                onPress: () => deleteTemplate(template.id)
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={{ color: theme.colors.error, fontSize: 16 }}>DEL</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => setShowTemplates(false)}
              >
                <Text style={styles.modalButtonText}>{t('buttons.cancel')}</Text>
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
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
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  descriptionInput: {
    flex: 1,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
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
    width: '90%',
    maxHeight: '70%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  productList: {
    maxHeight: 300,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  productOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
  },
  productType: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  templateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  templateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  templateList: {
    maxHeight: 300,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  templateDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteTemplate: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  emptyTemplates: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
});