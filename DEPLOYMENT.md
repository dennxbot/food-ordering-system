# 🚀 Deployment Guide

This guide will walk you through deploying your Food Ordering System to GitHub and hosting it on Render.

## 📋 Prerequisites

Before you begin, make sure you have:
- [x] Git installed on your computer
- [x] A GitHub account
- [x] A Render account (free tier available)
- [x] A Supabase project set up
- [x] Your environment variables ready

## 🔧 Step 1: Prepare Your Project

### 1.1 Environment Variables
Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 1.2 Test Local Build
```bash
npm run build
```
Make sure the build completes without errors.

## 📚 Step 2: Push to GitHub

### 2.1 Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Food Ordering System"
```

### 2.2 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click the "+" icon → "New repository"
3. Name your repository (e.g., `food-ordering-system`)
4. Choose "Public" or "Private"
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 2.3 Connect Local Repository to GitHub
```bash
git remote add origin https://github.com/yourusername/food-ordering-system.git
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy to Render

### 3.1 Create New Static Site
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub account if not already connected
4. Select your repository from the list

### 3.2 Configure Build Settings
Fill in the following settings:

**Basic Settings:**
- **Name**: `food-ordering-system` (or your preferred name)
- **Branch**: `main`
- **Root Directory**: Leave empty (uses root)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Advanced Settings:**
- **Auto-Deploy**: Yes (recommended)
- **Pull Request Previews**: Yes (optional)

### 3.3 Add Environment Variables
In the "Environment" section, add:
- **Key**: `VITE_SUPABASE_URL`
  **Value**: Your Supabase project URL
- **Key**: `VITE_SUPABASE_ANON_KEY`
  **Value**: Your Supabase anonymous key

### 3.4 Deploy
1. Click "Create Static Site"
2. Render will automatically start building your application
3. Wait for the build to complete (usually 2-5 minutes)

## ✅ Step 4: Verify Deployment

### 4.1 Check Build Status
- Monitor the build logs in Render dashboard
- Ensure no errors occur during build process

### 4.2 Test Your Application
1. Click on your site URL in Render dashboard
2. Test key functionality:
   - Homepage loads correctly
   - User registration/login works
   - Menu browsing functions
   - Admin panel is accessible (if you have admin credentials)

### 4.3 Test Admin Access
Create an admin user in your Supabase database:
```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## 🔄 Step 5: Automatic Deployments

### 5.1 Enable Auto-Deploy
With auto-deploy enabled, every push to your main branch will trigger a new deployment.

### 5.2 Making Updates
```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin main
```

Render will automatically detect the push and redeploy your site.

## 🌍 Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Render
1. Go to your site settings in Render
2. Click "Custom Domains"
3. Add your domain name
4. Follow the DNS configuration instructions

### 6.2 Configure DNS
Add the following records to your domain's DNS:
- **Type**: CNAME
- **Name**: www (or @)
- **Value**: Your Render site URL

## 🔒 Step 7: Security Considerations

### 7.1 Environment Variables
- Never commit `.env` files to GitHub
- Use Render's environment variable system
- Rotate keys periodically

### 7.2 Supabase Security
- Enable Row Level Security (RLS) on all tables
- Review and test your RLS policies
- Monitor usage in Supabase dashboard

## 🐛 Troubleshooting

### Common Issues

**Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**Site Loads but Features Don't Work:**
- Check browser console for errors
- Verify Supabase connection
- Ensure environment variables are correct

**Database Connection Issues:**
- Verify Supabase URL and key
- Check if your Supabase project is active
- Review RLS policies

**404 Errors on Refresh:**
- Ensure `render.yaml` is configured correctly
- Check that routes are set up for SPA

### Getting Help

1. Check Render's build logs
2. Review browser console errors
3. Check Supabase logs
4. Consult the main README.md for setup instructions

## 📊 Monitoring Your Application

### 7.1 Render Analytics
- Monitor site performance in Render dashboard
- Check build history and deployment logs
- Set up notifications for failed deployments

### 7.2 Supabase Monitoring
- Monitor database usage
- Check API usage and limits
- Review authentication logs

## 🎉 Success!

Your Food Ordering System is now live! Share your URL with others and start taking orders.

**Next Steps:**
- Set up monitoring and alerts
- Configure backup strategies
- Plan for scaling as your business grows
- Consider implementing CI/CD pipelines for larger teams

---

**Need Help?** 
- Check the [Render Documentation](https://render.com/docs)
- Review [Supabase Documentation](https://supabase.com/docs)
- Create an issue in your GitHub repository