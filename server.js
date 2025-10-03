const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const { 
  initializeDatabase, 
  createOwnerAccount, 
  userOperations, 
  buttonOperations,
  pendingRegistrationOperations,
  botOperations,
  botWebhookOperations
} = require('./database');
const { sendApprovalRequest, sendApprovalNotification } = require('./emailService');
const { requireAuth, requireRole, isValidEmail, isValidPassword, validatePassword } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database and create owner account
async function initApp() {
  try {
    await initializeDatabase();
    await createOwnerAccount(process.env.OWNER_EMAIL, process.env.OWNER_PASS);

    // Create default Bot 1
    const owner = await userOperations.findByEmail(process.env.OWNER_EMAIL);
    if (owner) {
      await botOperations.createDefaultBot(owner.id);
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initApp();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes

// Home
app.get('/', async (req, res) => {
  try {
    if (req.session.userId) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Home route error:', error);
    res.status(500).send('An error occurred');
  }
});

// Login page
app.get('/login', async (req, res) => {
  try {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
  } catch (error) {
    console.error('Login page error:', error);
    res.status(500).send('An error occurred');
  }
});

// Login POST
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userOperations.findByEmail(email);

    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    if (user.approved === 0) {
      return res.render('login', { error: 'Your account is pending approval' });
    }

    // bcrypt check (sync is acceptable here but you can switch to async if desired)
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Save session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred during login' });
  }
});

// Registration page
app.get('/register', async (req, res) => {
  try {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    res.render('register', { error: null, success: null });
  } catch (error) {
    console.error('Register page error:', error);
    res.status(500).send('An error occurred');
  }
});

// Registration POST
app.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  try {
    if (!isValidEmail(email)) {
      return res.render('register', { 
        error: 'Invalid email format', 
        success: null 
      });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.render('register', { 
        error: passwordValidation.errors.join('. '), 
        success: null 
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { 
        error: 'Passwords do not match', 
        success: null 
      });
    }
    
    // check if a user already exists
    const existingUser = await userOperations.findByEmail(email);
    if (existingUser) {
      return res.render('register', { 
        error: 'Email already registered', 
        success: null 
      });
    }

    // check if there's already a pending registration for this email
    let existingPending;
    try {
      existingPending = await pendingRegistrationOperations.findByEmail
        ? await pendingRegistrationOperations.findByEmail(email)
        : null;
    } catch (e) {
      // If the helper doesn't exist or errors, ignore and let create() handle uniqueness
      existingPending = null;
    }

    if (existingPending) {
      return res.render('register', {
        error: 'A registration for this email is already pending approval. Please wait for the owner to approve or contact them.',
        success: null
      });
    }
    
    const approvalToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    try {
      await pendingRegistrationOperations.create(email, hashedPassword, approvalToken);
    } catch (err) {
      // Handle unique constraint race condition gracefully
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        console.error('Registration unique constraint error:', err);
        return res.render('register', { 
          error: 'A registration for this email already exists and is pending approval.', 
          success: null 
        });
      }
      throw err;
    }

    await sendApprovalRequest(email, approvalToken);
    
    res.render('register', { 
      error: null, 
      success: 'Registration submitted! Please wait for owner approval. You will receive an email notification.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { 
      error: 'An error occurred during registration', 
      success: null 
    });
  }
});

// Approval page
app.get('/approve-registration', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Invalid approval link');
    }
    
    const pendingUser = await pendingRegistrationOperations.findByToken(token);
    
    if (!pendingUser) {
      return res.status(404).send('Registration request not found or already processed');
    }
    
    res.render('approve', { user: pendingUser, token });
  } catch (error) {
    console.error('Approve page error:', error);
    res.status(500).send('An error occurred');
  }
});

// Approve/Deny registration POST
app.post('/approve-registration', requireAuth, requireRole('owner'), async (req, res) => {
  const { token, action, role } = req.body;
  
  try {
    const pendingUser = await pendingRegistrationOperations.findByToken(token);
    
    if (!pendingUser) {
      return res.status(404).send('Registration request not found');
    }
    
    if (action === 'approve') {
      await userOperations.create(pendingUser.email, pendingUser.password, role, 1);
      await sendApprovalNotification(pendingUser.email, true, role);
      await pendingRegistrationOperations.delete(token);
      
      res.render('approval-result', { 
        success: true, 
        message: `User ${pendingUser.email} has been approved with role: ${role}` 
      });
    } else if (action === 'deny') {
      await sendApprovalNotification(pendingUser.email, false);
      await pendingRegistrationOperations.delete(token);
      
      res.render('approval-result', { 
        success: true, 
        message: `Registration for ${pendingUser.email} has been denied` 
      });
    } else {
      res.status(400).send('Invalid action');
    }
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).send('An error occurred during approval process');
  }
});

// Dashboard
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    let buttons;
    let bots;

    if (req.session.userRole === 'owner' || req.session.userRole === 'admin') {
      buttons = await buttonOperations.getAll();
    } else {
      buttons = await buttonOperations.getPublic();
    }

    bots = await botOperations.getAll();

    const selectedBotId = req.query.bot || 'all';

    if (selectedBotId !== 'all') {
      const botWebhooks = await botWebhookOperations.getAllByBot(parseInt(selectedBotId));

      // synchronous mapping over already-fetched botWebhooks
      buttons = buttons.map(button => {
        const botWebhook = botWebhooks.find(bw => bw.button_id === button.id);
        return {
          ...button,
          bot_webhook_url: botWebhook ? botWebhook.webhook_url : null,
          bot_webhook_id: botWebhook ? botWebhook.id : null
        };
      });
    } else {
      // use Promise.all when mapping async operations
      buttons = await Promise.all(buttons.map(async button => {
        const buttonWebhooks = await botWebhookOperations.getAllByButton(button.id);
        const hasAllWebhooks = buttonWebhooks.length === bots.length &&
                               buttonWebhooks.every(bw => bw.webhook_url && bw.webhook_url.trim() !== '');
        return {
          ...button,
          has_all_webhooks: hasAllWebhooks,
          webhook_count: buttonWebhooks.filter(bw => bw.webhook_url && bw.webhook_url.trim() !== '').length
        };
      }));
    }

    const buttonsByCategory = {};
    buttons.forEach(button => {
      if (!buttonsByCategory[button.category]) {
        buttonsByCategory[button.category] = [];
      }
      buttonsByCategory[button.category].push(button);
    });

    res.render('dashboard', {
      user: {
        email: req.session.userEmail,
        role: req.session.userRole
      },
      buttonsByCategory,
      bots,
      selectedBotId,
      totalBots: bots.length
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('An error occurred loading the dashboard');
  }
});

// Add button page
app.get('/add-button', requireAuth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const categories = await buttonOperations.getCategories();
    res.render('add-button', { 
      categories,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Add button page error:', error);
    res.status(500).send('An error occurred loading the add button page');
  }
});

// Add button POST
app.post('/add-button', requireAuth, requireRole('admin', 'owner'), async (req, res) => {
  const { title, category, newCategory, webhookUrl, visibility } = req.body;
  
  try {
    if (!title || !webhookUrl || !visibility) {
      const categories = await buttonOperations.getCategories();
      return res.render('add-button', { 
        categories,
        error: 'All fields are required',
        success: null
      });
    }
    
    const finalCategory = newCategory && newCategory.trim() !== '' ? newCategory.trim() : category;
    
    if (!finalCategory) {
      const categories = await buttonOperations.getCategories();
      return res.render('add-button', { 
        categories,
        error: 'Please select or create a category',
        success: null
      });
    }
    
    await buttonOperations.create(title, finalCategory, webhookUrl, visibility, req.session.userId);
    
    const categories = await buttonOperations.getCategories();
    res.render('add-button', { 
      categories,
      error: null,
      success: 'Button added successfully!'
    });
  } catch (error) {
    console.error('Add button error:', error);
    const categories = await buttonOperations.getCategories();
    res.render('add-button', { 
      categories,
      error: 'An error occurred while adding the button',
      success: null
    });
  }
});

// Create new bot
app.post('/create-bot', requireAuth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const bots = await botOperations.getAll();
    const nextBotNumber = bots.length + 1;
    const botName = `Bot ${nextBotNumber}`;
    
    await botOperations.create(botName, req.session.userId);
    
    res.json({ success: true, message: `${botName} created successfully!` });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Update bot webhook
app.post('/update-bot-webhook', requireAuth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const { botId, buttonId, webhookUrl } = req.body;
    
    await botWebhookOperations.create(parseInt(botId), parseInt(buttonId), webhookUrl);
    
    res.json({ success: true, message: 'Webhook updated successfully!' });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Trigger webhook
app.post('/trigger-webhook/:buttonId', requireAuth, async (req, res) => {
  try {
    const button = await buttonOperations.getById(req.params.buttonId);
    const { botId } = req.body;
    
    if (!button) {
      return res.status(404).json({ success: false, message: 'Button not found' });
    }
    
    if (button.visibility === 'private' && req.session.userRole === 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const payload = {
      buttonId: button.id,
      buttonTitle: button.title,
      triggeredBy: req.session.userEmail,
      timestamp: new Date().toISOString()
    };
    
    if (botId === 'all') {
      const allWebhooks = await botWebhookOperations.getAllWebhooksForButton(button.id);
      
      if (!allWebhooks || allWebhooks.length === 0) {
        return res.json({ 
          success: false, 
          message: 'No webhooks configured for this button'
        });
      }

      // fire all webhook calls concurrently and don't fail the whole request if one fails
      const webhookPromises = allWebhooks.map(webhook => {
        return axios.post(webhook.webhook_url, {
          ...payload,
          botName: webhook.bot_name,
          botId: webhook.bot_id
        }, {
          timeout: 5000
        }).catch(error => {
          console.error(`Webhook error for ${webhook.bot_name}:`, error.message);
          return { error: true };
        });
      });

      await Promise.allSettled(webhookPromises);
      
      res.json({ 
        success: true, 
        message: `Button "${button.title}" activated for ${allWebhooks.length} bot(s)!`
      });
    } else {
      const botWebhook = await botWebhookOperations.getByBotAndButton(parseInt(botId), button.id);
      
      if (!botWebhook || !botWebhook.webhook_url) {
        return res.json({ 
          success: false, 
          message: 'Webhook not configured for this bot'
        });
      }
      
      const bot = await botOperations.getById(parseInt(botId));
      
      try {
        await axios.post(botWebhook.webhook_url, {
          ...payload,
          botName: bot.name,
          botId: bot.id
        }, {
          timeout: 5000
        });
      } catch (err) {
        console.error('Webhook error:', err.message);
      }
      
      res.json({ 
        success: true, 
        message: `Button "${button.title}" activated for ${bot.name}!`
      });
    }
  } catch (error) {
    console.error('Trigger webhook error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Logout
app.get('/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  } catch (error) {
    console.error('Logout route error:', error);
    res.redirect('/login');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Owner account: ${process.env.OWNER_EMAIL}`);
});
