import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../utils/currency';

const KioskOrderSuccessPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the actual order ID from navigation state
  const orderId = location.state?.orderId;
  const orderNumber = orderId ? orderId.slice(-4) : Math.floor(Math.random() * 10000) + 1000;

  // Phase 1: Fresh data loading on route change
  useEffect(() => {
    // Refresh data when route changes (fresh page reload)
    console.log('Kiosk Order Success: Fresh data load on route change');
  }, [location.pathname]);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      console.log('🛒 Kiosk Order Success: Starting to fetch order data', {
        orderId,
        hasOrderId: !!orderId
      });
      
      if (!orderId) {
        console.log('❌ Kiosk Order Success: No order ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // First, get the kiosk order
        const { data: orderData, error: orderError } = await supabase
          .from('kiosk_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('❌ Kiosk Order Success: Error fetching kiosk order:', orderError);
          throw orderError;
        }
        
        console.log('🛒 Kiosk Order Success: Kiosk order fetched', {
          orderData,
          hasOrderData: !!orderData
        });

        // Then, get the order items separately
        const { data: itemsData, error: itemsError } = await supabase
          .from('kiosk_order_items')
          .select(`
            id,
            quantity,
            unit_price,
            size_id,
            food_item_id
          `)
          .eq('kiosk_order_id', orderId);

        if (itemsError) {
          console.error('❌ Error fetching kiosk order items:', itemsError);
          throw itemsError;
        }

        console.log('🛒 Kiosk Order Success: Raw items data', {
          itemsData,
          itemsCount: itemsData?.length || 0,
          orderId,
          queryError: itemsError
        });

        // Get food item names separately
        const enrichedItems = await Promise.all(
          (itemsData || []).map(async (item: any) => {
            // Get food item name
            const { data: foodItem, error: foodItemError } = await supabase
              .from('food_items')
              .select('name')
              .eq('id', item.food_item_id)
              .single();

            if (foodItemError) {
              console.error('❌ Error fetching food item:', foodItemError);
            }

            // Get size name if size_id exists
            let sizeName = null;
            if (item.size_id) {
              const { data: sizeItem, error: sizeError } = await supabase
                .from('item_sizes')
                .select('name')
                .eq('id', item.size_id)
                .single();
              
              if (sizeError) {
                console.error('❌ Error fetching size:', sizeError);
              }
              sizeName = sizeItem?.name;
            }

            const enrichedItem = {
              ...item,
              food_items: foodItem || { name: 'Unknown Item' },
              item_sizes: sizeName ? { name: sizeName } : null
            };

            console.log('📦 Enriched item:', enrichedItem);
            return enrichedItem;
          })
        );

        // Combine the data
        const data = {
          ...orderData,
          kiosk_order_items: enrichedItems || []
        };
        
        console.log('🛒 Kiosk Order Success: Final enriched data', {
          enrichedItems,
          enrichedItemsCount: enrichedItems?.length || 0,
          finalData: data
        });
        console.log('🛒 Kiosk Order Success: Order data fetched', {
          orderId,
          orderData: data,
          hasItems: data?.kiosk_order_items?.length > 0,
          itemsCount: data?.kiosk_order_items?.length || 0
        });
        setOrderData(data);
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/kiosk');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handlePrintOrder = () => {
    console.log('🖨️ Kiosk Order Success: Printing order', {
      orderData,
      hasItems: orderData?.kiosk_order_items?.length > 0,
      itemsCount: orderData?.kiosk_order_items?.length || 0,
      items: orderData?.kiosk_order_items
    });
    
    // Debug: Log the actual structure
    console.log('🖨️ Full orderData structure:', JSON.stringify(orderData, null, 2));
    console.log('🖨️ Order items:', orderData?.kiosk_order_items);
    if (orderData?.kiosk_order_items && orderData.kiosk_order_items.length > 0) {
      console.log('🖨️ First item structure:', orderData.kiosk_order_items[0]);
      console.log('🖨️ First item food_items:', orderData.kiosk_order_items[0]?.food_items);
      console.log('🖨️ First item item_sizes:', orderData.kiosk_order_items[0]?.item_sizes);
    }
    
    // Create order items section for receipt
    let orderItemsHTML = '';
    console.log('🖨️ Receipt Debug: orderData.kiosk_order_items:', orderData?.kiosk_order_items);
    
    if (orderData && orderData.kiosk_order_items && orderData.kiosk_order_items.length > 0) {
      orderItemsHTML = `
        <div style="margin: 20px 0;">
          <p style="font-weight: bold; margin-bottom: 10px;">ORDER ITEMS:</p>
          ${orderData.kiosk_order_items.map((item: any) => {
            // Debug each item
            console.log('🖨️ Receipt item:', item);
            
            const itemName = item.food_items?.name || 'Unknown Item';
            const sizeName = item.item_sizes?.name ? ` (${item.item_sizes.name})` : '';
            const quantity = item.quantity || 1;
            const unitPrice = item.unit_price || 0;
            const itemTotal = unitPrice * quantity;
            
            return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
              <span>${quantity}x ${itemName}${sizeName}</span>
              <span>${formatCurrency(itemTotal)}</span>
            </div>
          `;
          }).join('')}
          <div style="border-top: 1px solid #000; margin-top: 10px; padding-top: 5px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>TOTAL:</span>
              <span>${formatCurrency(orderData.total_amount)}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      console.log('🖨️ No order items found in receipt');
      orderItemsHTML = `
        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin: 20px 0;">
          <p style="text-align: center; font-weight: bold; margin: 0;">ORDER DETAILS</p>
          <p style="text-align: center; margin: 5px 0;">Please see order details in system</p>
        </div>
      `;
    }

    // Create a printable receipt
    const printContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0;">FOOD ORDERING SYSTEM</h2>
          <p style="margin: 5px 0;">KIOSK ORDER RECEIPT</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          <p><strong>Customer:</strong> ${user?.full_name || 'Kiosk Customer'}</p>
        </div>
        
        ${orderItemsHTML}
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-weight: bold;">PAYMENT REQUIRED</p>
          <p>Please bring this receipt to the cashier for payment processing</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px;">
          <p style="font-size: 12px;">Thank you for your order!</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt - ${orderNumber}</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleNewOrder = () => {
    navigate('/kiosk');
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-xl text-gray-600">
            Your order has been submitted to the kitchen
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Order Details
            </h2>
            <div className="text-lg space-y-2">
              <p><strong>Order Number:</strong> #{orderNumber}</p>
              <p><strong>Customer:</strong> {user?.full_name || 'Kiosk Customer'}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Order Items Section */}
          {!isLoading && orderData && orderData.kiosk_order_items && orderData.kiosk_order_items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {orderData.kiosk_order_items.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {item.quantity}x {item.food_items?.name || 'Unknown Item'}
                          {item.item_sizes?.name && (
                            <span className="text-gray-600"> ({item.item_sizes.name})</span>
                          )}
                        </span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(orderData.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Payment Required
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>Please print your receipt and bring it to the cashier for payment processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePrintOrder}
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg text-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Receipt</span>
          </button>

          <button
            onClick={handleNewOrder}
            className="w-full bg-green-600 text-white py-4 px-8 rounded-lg text-xl font-medium hover:bg-green-700 transition-colors"
          >
            Place New Order
          </button>
        </div>

        {/* Auto-redirect notice */}
        <div className="mt-8 text-gray-500">
          <p>Automatically returning to main menu in {countdown} seconds</p>
        </div>
      </div>
    </div>
  );
};

export default KioskOrderSuccessPage;