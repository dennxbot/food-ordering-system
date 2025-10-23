import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/currency';
import { apiService } from '../services/api';
import { printService } from '../services/printService';
import CartItemCard from '../components/CartItemCard';
import TouchButton from '../components/TouchButton';
import { Order } from '../types';

interface CartScreenProps {
  navigation: any;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const {
    state: cartState,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const formatPrice = (price: number): string => {
    return formatCurrency(price);
  };

  const calculateTax = (subtotal: number): number => {
    return subtotal * 0.085; // 8.5% tax rate
  };

  const subtotal = cartState.total;
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const handleContinueShopping = () => {
    navigation.goBack();
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handlePlaceOrder = async () => {
    if (cartState.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        order_items: cartState.items.map((item) => ({
          food_item_id: item.food_item.id,
          size_id: item.size?.id,
          quantity: item.quantity,
          unit_price: item.total_price / item.quantity,
          notes: item.notes,
        })),
        total_amount: total,
        order_type: 'dine_in' as const,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes: 'Kiosk Order',
      };

      // Create order
      const order: Order = await apiService.createOrder(orderData);

      // Print receipt
      const printSuccess = await printService.printReceipt(order, cartState.items);

      if (printSuccess) {
        Alert.alert(
          'Order Placed Successfully!',
          `Your order #${order.id.slice(-8).toUpperCase()} has been placed. Please take your receipt and pay at the cashier.`,
          [
            {
              text: 'OK',
              onPress: () => {
                clearCart();
                navigation.navigate('OrderConfirmation', { order });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Order Placed',
          `Your order #${order.id.slice(-8).toUpperCase()} has been placed, but there was an issue printing the receipt. Please note your order number and pay at the cashier.`,
          [
            {
              text: 'OK',
              onPress: () => {
                clearCart();
                navigation.navigate('OrderConfirmation', { order });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        'There was an error placing your order. Please try again or contact staff for assistance.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <CartItemCard
      item={item}
      onUpdateQuantity={updateQuantity}
      onUpdateNotes={updateNotes}
      onRemove={removeItem}
    />
  );

  if (cartState.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchButton
            title="Back"
            onPress={handleContinueShopping}
            variant="secondary"
            size="medium"
            icon="arrow-back"
            style={styles.backButton}
          />
          <Text style={styles.title}>Your Cart</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={80} color="#cccccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some delicious items from our menu
          </Text>
          <TouchButton
            title="Browse Menu"
            onPress={handleContinueShopping}
            variant="primary"
            size="large"
            icon="restaurant"
            style={styles.browseButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchButton
          title="Back"
          onPress={handleContinueShopping}
          variant="secondary"
          size="medium"
          icon="arrow-back"
          style={styles.backButton}
        />
        <Text style={styles.title}>Your Cart</Text>
        <TouchButton
          title="Clear"
          onPress={handleClearCart}
          variant="danger"
          size="medium"
          icon="trash"
          style={styles.clearButton}
        />
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartState.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({cartState.itemCount} items)
            </Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8.5%)</Text>
            <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchButton
            title="Continue Shopping"
            onPress={handleContinueShopping}
            variant="secondary"
            size="large"
            icon="add"
            style={styles.continueButton}
          />
          
          <TouchButton
            title={`Place Order - ${formatPrice(total)}`}
            onPress={handlePlaceOrder}
            variant="success"
            size="large"
            icon="checkmark"
            loading={loading}
            disabled={loading}
            style={styles.placeOrderButton}
          />
        </View>

        <View style={styles.paymentNote}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.paymentNoteText}>
            After placing your order, please pay at the cashier with your printed receipt.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  backButton: {
    paddingHorizontal: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
  },
  placeholder: {
    width: 60, // Same width as clear button for centering
  },
  cartContent: {
    padding: 20,
    paddingBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    paddingHorizontal: 32,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  continueButton: {
    flex: 1,
  },
  placeOrderButton: {
    flex: 2,
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 18,
  },
});

export default CartScreen;