# 🍽️ Food Ordering System

A modern, full-stack food ordering system built with React, TypeScript, and Supabase. Features a customer-facing interface for ordering food and a comprehensive admin panel for managing orders, menu items, customers, and POS operations.

## ✨ Features

### Customer Features
- 🏠 **Modern Homepage** with featured items and categories
- 🍕 **Interactive Menu** with search and filtering
- 🛒 **Shopping Cart** with real-time updates
- 📱 **Responsive Design** for all devices
- 👤 **User Authentication** and profile management
- 📋 **Order Tracking** with real-time status updates
- 💳 **Multiple Payment Options** (Cash, Card)
- 🚚 **Delivery & Pickup** options

### Admin Features
- 📊 **Dashboard** with analytics and quick actions
- 📋 **Order Management** with status tracking
- 🍽️ **Menu Management** with categories and sizes
- 👥 **Customer Management** with order history
- 💰 **POS System** for in-store orders
- 📈 **Sales Reports** and analytics
- ⚙️ **Account Settings** for admin users

### Technical Features
- 🔐 **Secure Authentication** with role-based access
- 🗄️ **Real-time Database** with Supabase
- 🎨 **Modern UI/UX** with Tailwind CSS
- 🌐 **Internationalization** support
- 📱 **PWA Ready** for mobile installation
- 🔄 **Real-time Updates** for orders and inventory

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Remix Icons
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Hooks, Context API
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Deployment**: Render (Frontend), Supabase (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/food-ordering-system.git
cd food-ordering-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations/` folder in order:
   - `20251014_add_order_cancellation.sql`
   - `20251015_add_pos_tables.sql`
   - `20251016_add_pos_reports.sql`
   - `20251016_add_user_context.sql`
   - `20251017_combine_sales_reports.sql`

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── base/           # Basic components (Button, Input, etc.)
│   └── feature/        # Feature-specific components
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── admin/          # Admin panel pages
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout process
│   ├── home/           # Homepage
│   ├── login/          # Authentication
│   ├── menu/           # Food menu
│   ├── orders/         # Order management
│   └── profile/        # User profile
├── router/             # Routing configuration
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── lib/                # Third-party integrations
└── i18n/               # Internationalization
```

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Schema
The application uses the following main tables:
- `users` - User accounts and profiles
- `categories` - Food categories
- `food_items` - Menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `pos_orders` - Point of sale orders
- `order_cancellations` - Order cancellation records

## 🚀 Deployment

### Deploy to Render

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Publish Directory**: `dist`

3. **Environment Variables**:
   Add your environment variables in Render dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Deploy**: Render will automatically build and deploy your application

### Custom Domain (Optional)
- Add your custom domain in Render dashboard
- Configure DNS settings with your domain provider

## 👥 User Roles

### Customer
- Browse menu and place orders
- Track order status
- Manage profile and order history

### Admin
- Full access to admin panel
- Manage orders, menu, customers
- Access POS system and reports
- Configure system settings

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **JWT Authentication** with Supabase
- **Role-based Access Control**
- **Input Validation** and sanitization
- **Secure API Endpoints**

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- PWA capabilities for mobile installation
- Optimized performance on mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/food-ordering-system/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Vite](https://vitejs.dev/) - Build Tool
- [Remix Icons](https://remixicon.com/) - Icon Library

---

Made with ❤️ for food lovers everywhere!