# Food Ordering Kiosk Application

A React Native kiosk application that integrates with the existing Food Ordering System hosted at `https://food-ordering-system-wlaz.onrender.com/`. This kiosk allows customers to browse the menu, place orders, and print receipts directly from the kiosk terminal.

## 🚀 Features

### Core Functionality
- **Menu Browsing**: Real-time menu display with categories and search functionality
- **Order Management**: Add items to cart, modify quantities, and add special instructions
- **Receipt Printing**: Automatic receipt generation for cashier payment
- **Real-time Sync**: Live synchronization with the admin panel and backend system
- **Touchscreen Optimized**: Large buttons and intuitive navigation for kiosk use

### Technical Features
- **API Integration**: Secure connection to existing food ordering backend
- **Offline Resilience**: Graceful handling of network issues
- **Accessibility**: Screen reader support and keyboard navigation
- **Auto-refresh**: Automatic menu updates every 30 seconds
- **Error Handling**: Comprehensive error management and user feedback

## 🛠 Technology Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and runtime
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **Axios**: HTTP client for API calls
- **Expo Print**: Receipt printing functionality

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Internet connection for API integration

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-ordering-kiosk
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Install web support (optional)**
   ```bash
   npm install react-native-web --legacy-peer-deps
   ```

## 🚀 Running the Application

### Web Development
```bash
npm run web
```
Access at: `http://localhost:8081`

### Mobile Development
```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Expo Go app
npm start
```

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TouchButton.tsx     # Touchscreen-optimized button
│   ├── MenuItemCard.tsx    # Menu item display card
│   └── CartItemCard.tsx    # Cart item with controls
├── context/            # React Context providers
│   └── CartContext.tsx     # Shopping cart state management
├── screens/            # Application screens
│   ├── MenuScreen.tsx      # Main menu browsing screen
│   └── CartScreen.tsx      # Shopping cart and checkout
├── services/           # External service integrations
│   ├── api.ts             # Backend API communication
│   └── printService.ts    # Receipt printing service
└── types/              # TypeScript type definitions
    └── index.ts           # Shared type definitions
```

## 🔌 API Integration

The kiosk integrates with the existing food ordering system through RESTful APIs:

### Endpoints Used
- `GET /api/food-items` - Fetch menu items
- `GET /api/categories` - Get food categories
- `POST /api/orders` - Create new orders
- `GET /api/health` - System health check

### Configuration
The API base URL is configured in `src/services/api.ts`:
```typescript
this.baseURL = 'https://food-ordering-system-wlaz.onrender.com';
```

## 🖨 Receipt Printing

The kiosk uses Expo Print for receipt generation:

### Features
- Professional receipt layout
- Order details and pricing
- Payment instructions
- Automatic fallback to PDF sharing if printer unavailable

### Configuration
Configure printer settings in `src/services/printService.ts`:
```typescript
const printService = new PrintService('Kiosk Terminal 1');
```

## 🎨 UI/UX Design

### Touchscreen Optimization
- **Large Touch Targets**: Minimum 48px touch areas
- **Clear Visual Hierarchy**: Prominent buttons and readable text
- **Intuitive Navigation**: Simple, linear user flow
- **Accessibility**: Screen reader support and high contrast

### Responsive Design
- **Tablet Optimized**: Designed for 10-12 inch tablets
- **Portrait/Landscape**: Supports both orientations
- **Scalable Components**: Adaptive sizing for different screen sizes

## 🔒 Security Features

- **API Authentication**: Secure communication with backend
- **Input Validation**: Client-side data validation
- **Error Handling**: Secure error messages without sensitive data
- **Network Security**: HTTPS-only communication

## 🧪 Testing

### Manual Testing Checklist
- [ ] Menu loads correctly
- [ ] Categories filter properly
- [ ] Search functionality works
- [ ] Items can be added to cart
- [ ] Cart quantities can be modified
- [ ] Orders can be placed successfully
- [ ] Receipts print correctly
- [ ] Error handling works properly

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Touch target sizes (minimum 48px)

## 🚀 Deployment

### Kiosk Deployment
1. **Hardware Setup**
   - Tablet or touchscreen device
   - Receipt printer (optional)
   - Stable internet connection

2. **App Installation**
   - Build production APK/IPA
   - Install on kiosk device
   - Configure kiosk mode (disable home button, etc.)

3. **Configuration**
   - Set API endpoint
   - Configure printer settings
   - Test all functionality

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```
API_BASE_URL=https://food-ordering-system-wlaz.onrender.com
KIOSK_LOCATION=Terminal 1
AUTO_REFRESH_INTERVAL=30000
PRINTER_ENABLED=true
```

### Kiosk Settings
Modify settings in the respective service files:
- API timeout: `src/services/api.ts`
- Print layout: `src/services/printService.ts`
- Auto-refresh interval: `src/screens/MenuScreen.tsx`

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check internet connection
   - Verify API endpoint URL
   - Check backend system status

2. **Printing Issues**
   - Ensure printer is connected
   - Check printer compatibility
   - Verify Expo Print permissions

3. **Performance Issues**
   - Clear app cache
   - Restart application
   - Check device memory

### Debug Mode
Enable debug logging by modifying the API service:
```typescript
console.log('Debug mode enabled');
```

## 📞 Support

For technical support or issues:
1. Check the troubleshooting section
2. Review application logs
3. Contact system administrator
4. Check backend system status

## 🔄 Updates

The kiosk application automatically syncs with the backend system:
- Menu items update every 30 seconds
- Real-time order synchronization
- Automatic error recovery

## 📄 License

This project is part of the Food Ordering System and follows the same licensing terms.

---

**Note**: This kiosk application is designed to work in conjunction with the main Food Ordering System. Ensure the backend system is running and accessible before deploying the kiosk.