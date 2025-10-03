# Beginstation Robot Control - Quick Setup Guide

## 🚀 Your Application is Ready!

The application has been successfully set up and is now running!

### 📍 Access Your Application

**Application URL**: https://3000-d6570721-a410-4c8c-9b2c-f2fccbdd2b0d.h1137.daytona.work

### 🔑 Pre-configured Owner Account

You can immediately log in with the owner account:

- **Email**: Milanwerkemail@gmail.com
- **Password**: Nalim213!!!?!

## 🎯 Quick Start Guide

### Step 1: Login as Owner
1. Visit the application URL above
2. Click on the login page (you'll be redirected automatically)
3. Enter the owner credentials
4. You'll be taken to the dashboard

### Step 2: Test the System

#### Option A: Create Your First Button
1. Click "Add New Button" on the dashboard
2. Fill in the form:
   - **Title**: Test Button
   - **Category**: Create a new category like "Testing"
   - **Webhook URL**: https://webhook.site/unique-id (get a test URL from webhook.site)
   - **Visibility**: Public
3. Click "Add Button"
4. Return to dashboard and click your new button to test the webhook

#### Option B: Test User Registration Flow
1. Open a new incognito/private browser window
2. Go to the application URL
3. Click "Register here"
4. Create a test account with:
   - Valid email format
   - Strong password (min 8 chars, uppercase, lowercase, number, special char)
5. Check the owner email (Milanwerkemail@gmail.com) for approval request
6. Click the approval link in the email
7. Assign a role (User or Admin)
8. Approve the registration
9. The new user will receive an email notification
10. Log in with the new account

## 📋 Features Overview

### Authentication System ✅
- ✅ Secure login with session management
- ✅ Registration with email validation
- ✅ Password requirements enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- ✅ Owner approval workflow via email

### Role-Based Access Control ✅
- ✅ **User Role**: Can activate buttons (view public buttons only)
- ✅ **Admin Role**: Can add buttons and activate them (view all buttons)
- ✅ **Owner Role**: Full control including user approval

### Button Management ✅
- ✅ Add buttons with title, category, webhook URL, and visibility
- ✅ Organize buttons by categories
- ✅ Public/Private visibility control
- ✅ Webhook triggering on button click
- ✅ Real-time feedback with toast notifications

### Design & UI ✅
- ✅ Red and white color theme
- ✅ Responsive design (mobile-friendly)
- ✅ Modern, clean interface
- ✅ Smooth animations and transitions

## 🔧 Technical Details

### Server Configuration
- **Port**: 3000
- **Database**: SQLite (robotcontrol.db)
- **Session Management**: Express-session with secure cookies
- **Email Service**: Nodemailer with Gmail

### Environment Variables
All configured in `.env`:
```
PORT=3000
SESSION_SECRET=super_secret_key_here
OWNER_EMAIL=Milanwerkemail@gmail.com
OWNER_PASS=Nalim213!!!?!
MAIL_USER=milanv482@gmail.com
MAIL_PASS=jved ract cren oumt
```

### File Structure
```
beginstation-robot-control/
├── server.js              # Main application
├── database.js            # Database operations
├── emailService.js        # Email functionality
├── middleware.js          # Auth & validation
├── views/                 # EJS templates
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── add-button.ejs
│   ├── approve.ejs
│   └── approval-result.ejs
├── public/css/
│   └── style.css          # Red & white theme
├── package.json
├── .env
└── README.md
```

## 🧪 Testing Checklist

### Authentication Tests
- [ ] Login with owner account
- [ ] Register new user
- [ ] Receive approval email
- [ ] Approve user registration
- [ ] Login with approved user
- [ ] Try login with unapproved user (should fail)
- [ ] Test password validation (weak passwords should be rejected)
- [ ] Test email validation (invalid emails should be rejected)

### Button Management Tests
- [ ] Add button as Admin/Owner
- [ ] Create new category
- [ ] Use existing category
- [ ] Set button as public
- [ ] Set button as private
- [ ] Click button to trigger webhook
- [ ] Verify webhook receives correct data

### Role Permission Tests
- [ ] User can see public buttons only
- [ ] User cannot access "Add Button" page
- [ ] Admin can see all buttons
- [ ] Admin can add buttons
- [ ] Owner can approve registrations
- [ ] Owner has full access

## 📧 Email Configuration

The application uses Gmail for sending emails. The credentials are already configured:
- **Email**: milanv482@gmail.com
- **App Password**: jved ract cren oumt

**Note**: If emails are not being sent, verify:
1. Gmail account has "App Passwords" enabled
2. 2-Factor Authentication is enabled on the Gmail account
3. The app password is correct and not expired

## 🛠️ Troubleshooting

### Server Not Running
```bash
# Check if server is running
tmux list-sessions

# View server logs
tmux capture-pane -pt robot_server

# Restart server
tmux kill-session -t robot_server
npm start
```

### Database Issues
```bash
# Reset database (WARNING: Deletes all data)
rm robotcontrol.db
npm start
# Owner account will be recreated automatically
```

### Port Issues
If port 3000 is in use, edit `.env`:
```
PORT=3001
```
Then restart the server.

## 📚 Additional Resources

- **Full Documentation**: See README.md for complete documentation
- **API Endpoints**: Listed in README.md
- **Database Schema**: Detailed in README.md

## 🎉 Success!

Your Beginstation Robot Control application is fully functional and ready to use!

### Next Steps:
1. Log in with the owner account
2. Create some test buttons
3. Test the webhook functionality
4. Register additional users and test the approval workflow
5. Customize the application as needed

---

**Need Help?** Refer to the README.md file for detailed documentation and troubleshooting guides.