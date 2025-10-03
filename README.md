# Beginstation Robot Control

A comprehensive Node.js application for robot control with role-based access control, authentication, and webhook integration.

## Features

### 🔐 Authentication & Security
- **Secure Registration**: Email validation and strong password requirements
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- **Owner Approval System**: New registrations require owner approval via email
- **Session Management**: Secure session-based authentication
- **Role-Based Access Control**: Three distinct roles with different permissions

### 👥 User Roles

1. **User**
   - Can activate buttons
   - View public buttons only
   - Basic dashboard access

2. **Admin**
   - All User permissions
   - Can add new buttons
   - View all buttons (public and private)
   - Manage button categories

3. **Owner**
   - All Admin permissions
   - Full system control
   - Approve/deny new user registrations
   - Assign roles to new users

### 🎛️ Button Management
- **Create Buttons**: Add control buttons with custom titles
- **Categories**: Organize buttons into categories (create new or use existing)
- **Webhook Integration**: Each button triggers a webhook URL when clicked
- **Visibility Control**: Set buttons as public or private
- **Real-time Feedback**: Toast notifications for button actions

### 🎨 Design
- **Red & White Theme**: Professional color scheme
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

### 1. Clone or Download the Project

```bash
# If you have the project files, navigate to the directory
cd beginstation-robot-control
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- express-session
- bcrypt
- better-sqlite3
- dotenv
- nodemailer
- axios
- body-parser
- ejs

### 3. Configure Environment Variables

The `.env` file is already configured with the required settings:

```env
PORT=3000
SESSION_SECRET=super_secret_key_here
MAIL_USER=milanv482@gmail.com
MAIL_PASS=jved ract cren oumt
```

**Note**: The email credentials are configured for Gmail. Make sure the Gmail account has "App Passwords" enabled if using 2FA.

### 4. Start the Application

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on `http://localhost:3000`


You can log in immediately with these credentials to access all features.

## Usage Guide

### For New Users

1. **Register**: Navigate to `/register` and create an account
   - Enter a valid email address
   - Create a strong password meeting all requirements
   - Confirm your password
2. **Wait for Approval**: The owner will receive an email notification
3. **Email Notification**: You'll receive an email once approved/denied
4. **Login**: After approval, log in with your credentials

### For the Owner

1. **Check Email**: You'll receive an email when someone registers
2. **Click Approval Link**: The email contains a link to the approval page
3. **Assign Role**: Choose between User or Admin role
4. **Approve or Deny**: Click the appropriate button
5. **Confirmation**: The user will be notified via email

### Adding Buttons (Admin/Owner)

1. **Navigate to Dashboard**: Log in and go to the main dashboard
2. **Click "Add New Button"**: Located in the top right
3. **Fill in Details**:
   - **Title**: Name of the button (e.g., "Start Motor")
   - **Category**: Select existing or create new
   - **Webhook URL**: The URL to call when button is clicked
   - **Visibility**: Public (all users) or Private (admin/owner only)
4. **Submit**: Click "Add Button"

### Using Buttons

1. **View Dashboard**: All available buttons are organized by category
2. **Click Button**: Simply click any button to trigger its webhook
3. **Feedback**: A toast notification will confirm the action

## Project Structure

```
beginstation-robot-control/
├── server.js                 # Main application server
├── database.js              # Database operations and schema
├── emailService.js          # Email functionality
├── middleware.js            # Authentication and validation
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── views/                   # EJS templates
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Registration page
│   ├── dashboard.ejs       # Main dashboard
│   ├── add-button.ejs      # Add button form
│   ├── approve.ejs         # Approval page
│   └── approval-result.ejs # Approval confirmation
├── public/                  # Static files
│   └── css/
│       └── style.css       # Stylesheet (red & white theme)
└── robotcontrol.db         # SQLite database (auto-created)
```

## Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique email address
- `password`: Hashed password
- `role`: user, admin, or owner
- `approved`: 0 (pending) or 1 (approved)
- `created_at`: Registration timestamp

### Buttons Table
- `id`: Primary key
- `title`: Button name
- `category`: Category name
- `webhook_url`: URL to trigger
- `visibility`: public or private
- `created_by`: User ID who created it
- `created_at`: Creation timestamp

### Pending Registrations Table
- `id`: Primary key
- `email`: User email
- `password`: Hashed password
- `token`: Unique approval token
- `created_at`: Registration timestamp

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /register` - Registration page
- `POST /register` - Process registration
- `GET /logout` - Logout user

### Dashboard
- `GET /` - Redirect to dashboard or login
- `GET /dashboard` - Main control dashboard

### Button Management
- `GET /add-button` - Add button form (Admin/Owner)
- `POST /add-button` - Create new button (Admin/Owner)
- `POST /trigger-webhook/:buttonId` - Trigger button webhook

### Approval System
- `GET /approve-registration` - Approval page (Owner)
- `POST /approve-registration` - Process approval/denial (Owner)

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Session Security**: Secure session management with secret key
3. **Email Validation**: Regex-based email format validation
4. **Password Requirements**: Enforced strong password policy
5. **Role-Based Access**: Middleware protection for sensitive routes
6. **CSRF Protection**: Form-based submissions with session validation

## Webhook Integration

When a button is clicked, the application **immediately responds to the user** and triggers the webhook in the background (fire-and-forget approach). This ensures instant feedback without waiting for the webhook endpoint to respond.

The webhook receives a POST request with the following payload:

```json
{
  "buttonId": 1,
  "buttonTitle": "Start Motor",
  "triggeredBy": "user@example.com",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Note**: The button activation does not wait for or depend on the webhook response. If the webhook endpoint is unavailable, the error is logged but does not affect the user experience.

## Troubleshooting

### Email Not Sending
- Verify Gmail credentials in `.env`
- Enable "Less secure app access" or use App Passwords
- Check spam folder for approval emails

### Database Issues
- Delete `robotcontrol.db` and restart to recreate
- Check file permissions in the project directory

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill`

### Cannot Login
- Verify credentials are correct
- Check if account is approved (owner account is pre-approved)
- Clear browser cookies and try again

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restart on file changes.

### Adding New Features

1. **Database Changes**: Modify `database.js`
2. **Routes**: Add to `server.js`
3. **Views**: Create new EJS files in `views/`
4. **Styles**: Update `public/css/style.css`

## Production Deployment

1. **Update Environment Variables**: Use production values
2. **Enable HTTPS**: Set `cookie.secure: true` in session config
3. **Use Production Database**: Consider PostgreSQL or MySQL
4. **Set NODE_ENV**: `NODE_ENV=production`
5. **Use Process Manager**: PM2 or similar for process management

## License

ISC

## Support

For issues or questions, contact the system administrator.

---

**Built with ❤️ for Beginstation Robot Control**
