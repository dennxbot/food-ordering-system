
import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../utils/currency';
import Button from '../../../components/base/Button';

interface ReportData {
  totalOrders: number;
  totalSales: number;
  avgOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    orders: number;
    sales: number;
    online_sales: number;
  }>;
  ordersByStatus: {
    pending: number;
    preparing: number;
    ready: number;
    out_for_delivery: number;
    completed: number;
    cancelled: number;
  };
}

const AdminReports = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState('today');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchReportData();
  }, [isAuthenticated, isAdmin, isLoading, navigate, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString(),
          end: now.toISOString()
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: monthStart.toISOString(),
          end: now.toISOString()
        };
      default:
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  const fetchReportData = async () => {
    try {
      setIsLoadingData(true);
      const { start, end } = getDateRange();

      // Fetch combined sales report
      const { data: reportData, error: reportError } = await supabase
        .rpc('get_combined_sales_report', {
          p_start_date: start,
          p_end_date: end
        });

      if (reportError) {
        console.error('Error fetching report data:', reportError);
        // Set empty report data on error
        setReportData({
          totalOrders: 0,
          totalSales: 0,
          avgOrderValue: 0,
          ordersByStatus: {
            pending: 0,
            preparing: 0,
            ready: 0,
            out_for_delivery: 0,
            completed: 0,
            cancelled: 0
          },
          topSellingItems: [],
          dailySales: []
        });
        return;
      }

      if (!reportData || !reportData[0]) {
        // Handle empty data case
        setReportData({
          totalOrders: 0,
          totalSales: 0,
          avgOrderValue: 0,
          ordersByStatus: {
            pending: 0,
            preparing: 0,
            ready: 0,
            out_for_delivery: 0,
            completed: 0,
            cancelled: 0
          },
          topSellingItems: [],
          dailySales: []
        });
        return;
      }

      const report = reportData[0];
      
      setReportData({
        totalOrders: Number(report.total_orders),
        totalSales: Number(report.total_sales),
        avgOrderValue: Number(report.avg_order_value),
        ordersByStatus: report.orders_by_status,
        topSellingItems: report.top_selling_items,
        dailySales: report.daily_sales_data.map((day: any) => ({
          date: day.date,
          orders: day.orders,
          sales: day.sales,
          online_sales: day.online_sales
        }))
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportOnlineOrders = async () => {
    try {
      const { start, end } = getDateRange();

      // Fetch online orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          order_type,
          payment_method,
          order_items (
            quantity,
            unit_price,
            food_items (
              name
            )
          )
        `)
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Process orders into rows

      // Format the data for CSV
      const csvRows = [
        ['Date', 'Order #', 'Items', 'Order Details', 'Payment Method', 'Total']
      ];

      let overallTotal = 0;

      // Process each order and its items separately
      orders.forEach((order: any) => {
        // For each item in the order, create a separate row
        order.order_items.forEach((item: any) => {
          const date = new Date(order.created_at).toLocaleDateString();
          const orderNumber = `#${order.id.slice(-8)}`;
          const itemText = `${item.quantity}x ${item.food_items.name}`;
          const orderType = order.order_type === 'delivery' ? 'delivery' : 'Pickup';
          const paymentMethod = order.payment_method === 'cash'
            ? (order.order_type === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup')
            : 'Card';
          const total = item.quantity * item.unit_price;
          
          overallTotal += total;

          csvRows.push([
            date,
            orderNumber,
            itemText,
            orderType,
            paymentMethod,
            `₱${total.toFixed(2)}`
          ]);
        });
      });

      // Add empty row and overall total
      csvRows.push([]);
      csvRows.push(['', '', '', '', 'OVERALL TOTAL', `₱${overallTotal.toFixed(2)}`]);

      // Create Excel XML for centered alignment
      let csvString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>\r\n';
      csvString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\r\n';
      csvString += '<Styles>\r\n';
      csvString += '<Style ss:ID="Default"><Alignment ss:Horizontal="Center"/></Style>\r\n';
      csvString += '<Style ss:ID="Header"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1"/></Style>\r\n';
      csvString += '<Style ss:ID="Total"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1"/></Style>\r\n';
      csvString += '</Styles>\r\n';
      csvString += '<Worksheet ss:Name="Sheet1"><Table>\r\n';
      
      // Add header row with center alignment
      const headerRow = csvRows[0].map(header => 
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>`
      ).join('');
      csvString += `<Row>${headerRow}</Row>\r\n`;

      // Add data rows with center alignment
      const dataRows = csvRows.slice(1);
      dataRows.forEach((rowData, index) => {
        const row = rowData.map(cell => {
          if (cell === null || cell === undefined) return '<Cell><Data ss:Type="String"></Data></Cell>';
          const cellStr = String(cell);
          const escaped = cellStr.replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;');
          // Use Total style for the overall total row
          const isTotal = index === dataRows.length - 1;
          const styleId = isTotal ? 'Total' : 'Default';
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escaped}</Data></Cell>`;
        }).join('');
        csvString += `<Row>${row}</Row>\r\n`;
      });

      // Close Excel XML tags
      csvString += '</Table></Worksheet></Workbook>';

      // Create Blob with BOM and content
      const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
      
      // Create final blob with BOM and content
      const blob = new Blob([BOM, csvString], { 
        type: 'application/vnd.ms-excel'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `online-orders-${dateRange}-${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting online orders:', error);
      alert('Failed to export online orders. Please try again.');
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const { start, end } = getDateRange();
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();

    const csvContent = [
      ['Sales Report Summary'],
      [`Report Period: ${dateRange.toUpperCase()}`],
      [`Date Range: ${startDate} to ${endDate}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['Overall Metrics', 'Value', 'Percentage'],
      ['Total Orders', reportData.totalOrders.toString(), '100%'],
      ['Total Sales', formatCurrency(reportData.totalSales), '100%'],
      ['Average Order Value', formatCurrency(reportData.avgOrderValue), '-'],
      [''],
      ['Order Status Breakdown', 'Count', 'Percentage'],
      ['Pending', reportData.ordersByStatus.pending.toString(), 
        `${((reportData.ordersByStatus.pending / reportData.totalOrders) * 100).toFixed(1)}%`],
      ['Preparing', reportData.ordersByStatus.preparing.toString(),
        `${((reportData.ordersByStatus.preparing / reportData.totalOrders) * 100).toFixed(1)}%`],
      ['Ready', reportData.ordersByStatus.ready.toString(),
        `${((reportData.ordersByStatus.ready / reportData.totalOrders) * 100).toFixed(1)}%`],
      ['Out for Delivery', reportData.ordersByStatus.out_for_delivery.toString(),
        `${((reportData.ordersByStatus.out_for_delivery / reportData.totalOrders) * 100).toFixed(1)}%`],
      ['Completed', reportData.ordersByStatus.completed.toString(),
        `${((reportData.ordersByStatus.completed / reportData.totalOrders) * 100).toFixed(1)}%`],
      ['Cancelled', reportData.ordersByStatus.cancelled.toString(),
        `${((reportData.ordersByStatus.cancelled / reportData.totalOrders) * 100).toFixed(1)}%`],
      [''],
      ['Top Selling Items', 'Quantity', 'Revenue', 'Avg Price', '% of Total Sales'],
      ...reportData.topSellingItems.map(item => [
        item.name,
        item.quantity.toString(),
        formatCurrency(item.revenue),
        formatCurrency(item.revenue / item.quantity),
        `${((item.revenue / reportData.totalSales) * 100).toFixed(1)}%`
      ]),
      [''],
      ['Daily Sales Breakdown'],
      ['Date', 'Orders', 'Total Sales', 'Online Sales', 'Avg Order Value', '% Online'],
      ...reportData.dailySales.map(day => [
        new Date(day.date).toLocaleDateString(),
        day.orders.toString(),
        formatCurrency(day.sales),
        formatCurrency(day.online_sales),
        formatCurrency(day.sales / day.orders),
        `${((day.online_sales / day.sales) * 100).toFixed(1)}%`
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (isLoadingData || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-orange-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                <p className="text-gray-600">View detailed sales analytics from database</p>
              </div>
              <div className="flex gap-2">
              <Button
                onClick={exportReport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 whitespace-nowrap"
              >
                <i className="ri-download-line mr-2"></i>
                  Export Full Report
                </Button>
                <Button
                  onClick={exportOnlineOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 whitespace-nowrap"
                >
                  <i className="ri-shopping-cart-line mr-2"></i>
                  Export Online Orders
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Date Range Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Report Period</h2>
              <div className="flex space-x-1">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This Week' },
                  { key: 'month', label: 'This Month' }
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setDateRange(period.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      dateRange === period.key
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Orders Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <i className="ri-shopping-cart-line text-sm text-blue-600"></i>
                    </div>
                    <span className="text-sm font-medium text-blue-900">Online Orders</span>
                  </div>
                  <div className="ml-11">
                    <p className="text-xl font-bold text-blue-900">
                      {reportData.dailySales.reduce((sum, day) => sum + (day.online_sales > 0 ? 1 : 0), 0)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {((reportData.dailySales.reduce((sum, day) => sum + (day.online_sales > 0 ? 1 : 0), 0) / reportData.totalOrders) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Sales Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-money-peso-circle-line text-xl text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalSales)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <i className="ri-shopping-cart-line text-sm text-blue-600"></i>
                    </div>
                    <span className="text-sm font-medium text-blue-900">Online Sales</span>
                  </div>
                  <div className="ml-11">
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(reportData.dailySales.reduce((sum, day) => sum + day.online_sales, 0))}
                    </p>
                    <p className="text-xs text-blue-700">
                      {((reportData.dailySales.reduce((sum, day) => sum + day.online_sales, 0) / reportData.totalSales) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                </div>
              </div>
            </div>

          {/* Average Order Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-bar-chart-line text-xl text-purple-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Avg Order</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.avgOrderValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-shopping-cart-line text-xl text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Online Avg Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      reportData.dailySales.reduce((sum, day) => sum + day.online_sales, 0) /
                      Math.max(1, reportData.dailySales.reduce((sum, day) => sum + (day.online_sales > 0 ? 1 : 0), 0))
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Selling Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
              {reportData.topSellingItems.length > 0 ? (
                <div className="space-y-4">
                  {reportData.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.quantity} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-shopping-cart-line text-3xl mb-2"></i>
                  <p>No sales data for this period</p>
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
                    <span>Pending</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 rounded-full mr-3"></div>
                    <span>Preparing</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.preparing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-400 rounded-full mr-3"></div>
                    <span>Ready</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.ready}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-400 rounded-full mr-3"></div>
                    <span>Out for Delivery</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.out_for_delivery}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
                    <span>Completed</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                    <span>Cancelled</span>
                  </div>
                  <span className="font-semibold">{reportData.ordersByStatus.cancelled}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Sales Trend</h3>
            {reportData.dailySales.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="relative h-64 min-w-full">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-600 py-2">
                    {[...Array(6)].map((_, i) => {
                    const maxSales = Math.max(...reportData.dailySales.map(d => d.sales));
                      const value = (maxSales / 5) * (5 - i);
                    return (
                        <div key={i} className="flex items-center">
                          <span className="w-full text-right pr-2">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart area */}
                  <div className="absolute left-16 right-0 top-0 bottom-0">
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-full border-t border-gray-200"
                          style={{ top: `${(i * 100) / 5}%` }}
                        ></div>
                      ))}
                    </div>

                    {/* Area chart */}
                    <svg className="absolute inset-0" preserveAspectRatio="none" viewBox={`0 0 ${reportData.dailySales.length - 1} 100`}>
                      <defs>
                        <linearGradient id="onlineSalesGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {reportData.dailySales.length > 1 && (
                        <>
                          {/* Online Sales Area */}
                          <path
                            key="online-sales-area"
                            d={`
                              M 0 ${100 - (reportData.dailySales[0].online_sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}
                              ${reportData.dailySales.map((day, i) => 
                                `L ${i} ${100 - (day.online_sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}`
                              ).join(' ')}
                              L ${reportData.dailySales.length - 1} 100
                              L 0 100
                              Z
                            `}
                            fill="url(#onlineSalesGradient)"
                          />
                          {/* Online Sales Line */}
                          <path
                            key="online-sales-line"
                            d={`
                              M 0 ${100 - (reportData.dailySales[0].online_sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}
                              ${reportData.dailySales.map((day, i) => 
                                `L ${i} ${100 - (day.online_sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}`
                              ).join(' ')}
                            `}
                            fill="none"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="2"
                          />

                          {/* Data points */}
                          {reportData.dailySales.map((day, i) => (
                            <Fragment key={`data-points-${i}`}>
                              {/* Online Sales Point */}
                              <circle
                                cx={i}
                                cy={100 - (day.online_sales / Math.max(...reportData.dailySales.map(d => d.sales))) * 100}
                                r="3"
                                fill="white"
                                stroke="rgb(59, 130, 246)"
                                strokeWidth="2"
                                className="hover:r-4 transition-all duration-200"
                              />
                            </Fragment>
                          ))}
                        </>
                      )}
                    </svg>

                    {/* Legend */}
                    <div className="absolute top-0 right-0 flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Online Sales</span>
                      </div>
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-600 pt-4">
                      {reportData.dailySales.map((day, index) => (
                        <div key={index} className="text-center">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      ))}
                        </div>
                      </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-bar-chart-line text-3xl mb-2"></i>
                <p>No sales data for this period</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default AdminReports;
