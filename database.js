const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'robotcontrol.db'));

// Create tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('user', 'admin', 'owner')) DEFAULT 'user',
          approved INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Buttons table
      db.run(`
        CREATE TABLE IF NOT EXISTS buttons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          webhook_url TEXT NOT NULL,
          visibility TEXT CHECK(visibility IN ('public', 'private')) DEFAULT 'public',
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Bots table
      db.run(`
        CREATE TABLE IF NOT EXISTS bots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Bot webhooks table
      db.run(`
        CREATE TABLE IF NOT EXISTS bot_webhooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bot_id INTEGER NOT NULL,
          button_id INTEGER NOT NULL,
          webhook_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
          FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE,
          UNIQUE(bot_id, button_id)
        )
      `);

      // Pending registrations table
      db.run(`
        CREATE TABLE IF NOT EXISTS pending_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Database initialization error:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
}

// Create owner account if it doesn't exist
function createOwnerAccount(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (email, password, role, approved) VALUES (?, ?, ?, ?)', 
               [email, hashedPassword, 'owner', 1], (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Owner account created successfully');
            resolve();
          }
        });
      } else {
        console.log('Owner account already exists');
        resolve();
      }
    });
  });
}

// User operations
const userOperations = {
  create: (email, password, role = 'user', approved = 0) => {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run('INSERT INTO users (email, password, role, approved) VALUES (?, ?, ?, ?)', 
             [email, hashedPassword, role, approved], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },
  
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  updateRole: (email, role) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET role = ?, approved = 1 WHERE email = ?', [role, email], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  
  getAllPendingUsers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users WHERE approved = 0', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  deleteUser: (email) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE email = ?', [email], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Button operations
const buttonOperations = {
  create: (title, category, webhookUrl, visibility, createdBy) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO buttons (title, category, webhook_url, visibility, created_by) VALUES (?, ?, ?, ?, ?)', 
             [title, category, webhookUrl, visibility, createdBy], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },
  
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM buttons ORDER BY category, title', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  getPublic: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM buttons WHERE visibility = "public" ORDER BY category, title', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM buttons WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM buttons WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  
  getCategories: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT category FROM buttons ORDER BY category', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Bot operations
const botOperations = {
  create: (name, createdBy) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO bots (name, created_by) VALUES (?, ?)', [name, createdBy], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },
  
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bots ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM bots WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM bots WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  
  createDefaultBot: (userId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM bots WHERE name = ?', ['Bot 1'], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          db.run('INSERT INTO bots (name, created_by) VALUES (?, ?)', ['Bot 1', userId], function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          });
        } else {
          resolve(row);
        }
      });
    });
  }
};

// Bot webhook operations
const botWebhookOperations = {
  create: (botId, buttonId, webhookUrl) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO bot_webhooks (bot_id, button_id, webhook_url) VALUES (?, ?, ?)', 
             [botId, buttonId, webhookUrl], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },
  
  getByBotAndButton: (botId, buttonId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM bot_webhooks WHERE bot_id = ? AND button_id = ?', [botId, buttonId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  getAllByBot: (botId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bot_webhooks WHERE bot_id = ?', [botId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  getAllByButton: (buttonId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bot_webhooks WHERE button_id = ?', [buttonId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  delete: (botId, buttonId) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM bot_webhooks WHERE bot_id = ? AND button_id = ?', [botId, buttonId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  
  getAllWebhooksForButton: (buttonId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT bw.*, b.name as bot_name 
        FROM bot_webhooks bw 
        JOIN bots b ON bw.bot_id = b.id 
        WHERE bw.button_id = ? AND bw.webhook_url IS NOT NULL AND bw.webhook_url != ''
      `, [buttonId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Pending registration operations
const pendingRegistrationOperations = {
  create: (email, password, token) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO pending_registrations (email, password, token) VALUES (?, ?, ?)',
             [email, password, token], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  // --- new helper: find pending by email ---
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pending_registrations WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // --- new helper: upsert (insert or replace) ---
  createOrReplace: (email, password, token) => {
    return new Promise((resolve, reject) => {
      // INSERT OR REPLACE will delete the existing row with the same UNIQUE key and insert the new one.
      db.run('INSERT OR REPLACE INTO pending_registrations (email, password, token, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
             [email, password, token], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  findByToken: (token) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pending_registrations WHERE token = ?', [token], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  delete: (token) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM pending_registrations WHERE token = ?', [token], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  createOwnerAccount,
  userOperations,
  buttonOperations,
  pendingRegistrationOperations,
  botOperations,
  botWebhookOperations
};
