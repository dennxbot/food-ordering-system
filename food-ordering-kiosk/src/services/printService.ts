import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { CartItem, Order, PrintReceipt } from '../types';
import { formatCurrency } from '../utils/currency';

class PrintService {
  private kioskLocation: string = 'Kiosk Terminal 1';

  constructor(kioskLocation?: string) {
    if (kioskLocation) {
      this.kioskLocation = kioskLocation;
    }
  }

  private formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private generateReceiptHTML(receipt: PrintReceipt): string {
    const itemsHTML = receipt.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px dotted #ccc;">
            <div style="font-weight: bold;">${item.food_item.name}</div>
            ${item.size ? `<div style="font-size: 12px; color: #666;">Size: ${item.size.size_name}</div>` : ''}
            ${item.notes ? `<div style="font-size: 12px; color: #666;">Notes: ${item.notes}</div>` : ''}
          </td>
          <td style="padding: 8px 0; text-align: center; border-bottom: 1px dotted #ccc;">
            ${item.quantity}
          </td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px dotted #ccc;">
            ${this.formatCurrency(item.total_price)}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              max-width: 300px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .restaurant-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .order-info {
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ccc;
            }
            .order-info div {
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              text-align: left;
              padding: 8px 0;
              border-bottom: 2px solid #000;
              font-weight: bold;
            }
            .totals {
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .total-line {
              font-weight: bold;
              font-size: 16px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              font-size: 12px;
            }
            .payment-note {
              background-color: #f0f0f0;
              padding: 10px;
              margin: 15px 0;
              border: 1px solid #ccc;
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">Food Ordering System</div>
            <div>${receipt.kioskLocation}</div>
          </div>

          <div class="order-info">
            <div><strong>Order #:</strong> ${receipt.orderNumber}</div>
            <div><strong>Date:</strong> ${receipt.timestamp}</div>
            ${receipt.customerName ? `<div><strong>Customer:</strong> ${receipt.customerName}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>${this.formatCurrency(receipt.subtotal)}</span>
            </div>
            <div>
              <span>Tax:</span>
              <span>${this.formatCurrency(receipt.tax)}</span>
            </div>
            <div class="total-line">
              <span>Total:</span>
              <span>${this.formatCurrency(receipt.total)}</span>
            </div>
          </div>

          <div class="payment-note">
            PLEASE PAY AT CASHIER
          </div>

          <div class="footer">
            <div>Thank you for your order!</div>
            <div>Please keep this receipt for payment</div>
          </div>
        </body>
      </html>
    `;
  }

  async printReceipt(order: Order, items: CartItem[]): Promise<boolean> {
    try {
      const now = new Date();
      const orderNumber = order.id.slice(-8).toUpperCase();
      
      // Calculate tax (assuming 8.5% tax rate)
      const taxRate = 0.085;
      const subtotal = order.total_amount / (1 + taxRate);
      const tax = order.total_amount - subtotal;

      const receipt: PrintReceipt = {
        orderId: order.id,
        orderNumber,
        customerName: order.customer_name,
        items,
        subtotal,
        tax,
        total: order.total_amount,
        timestamp: this.formatDateTime(now),
        kioskLocation: this.kioskLocation,
      };

      const html = this.generateReceiptHTML(receipt);

      // Check if printing is available
      const isAvailable = await Print.isAvailableAsync();
      
      if (isAvailable) {
        // Print the receipt
        await Print.printAsync({
          html,
          width: 300, // 3 inch width for receipt printer
          height: 600, // Auto height
        });
        
        console.log('Receipt printed successfully');
        return true;
      } else {
        // If printing is not available, share as PDF
        console.log('Printing not available, creating PDF instead');
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        return true;
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      return false;
    }
  }

  async printTestReceipt(): Promise<boolean> {
    try {
      const testReceipt: PrintReceipt = {
        orderId: 'test-123',
        orderNumber: 'TEST123',
        customerName: 'Test Customer',
        items: [
          {
            id: 'test-item-1',
            food_item: {
              id: '1',
              name: 'Test Burger',
              description: 'A test burger',
              price: 12.99,
              category: 'Burgers',
              available: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            quantity: 2,
            total_price: 25.98,
          },
        ],
        subtotal: 23.94,
        tax: 2.04,
        total: 25.98,
        timestamp: this.formatDateTime(new Date()),
        kioskLocation: this.kioskLocation,
      };

      const html = this.generateReceiptHTML(testReceipt);
      
      const isAvailable = await Print.isAvailableAsync();
      
      if (isAvailable) {
        await Print.printAsync({ html });
        return true;
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        return true;
      }
    } catch (error) {
      console.error('Error printing test receipt:', error);
      return false;
    }
  }

  setKioskLocation(location: string): void {
    this.kioskLocation = location;
  }
}

export const printService = new PrintService();
export default PrintService;