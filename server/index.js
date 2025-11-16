const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./database');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '../client')));


const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-very-secret-key'; // In production, use an environment variable

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Optional JWT verification for root route
const verifyTokenOptional = (req, res, next) => {
    const token = req.cookies.token;
    if (token == null) {
        req.user = null;
    } else {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            req.user = err ? null : user;
        });
    }
    next();
};


// Frontend Routes
app.get('/', verifyTokenOptional, (req, res) => {
    if (req.user) {
        res.sendFile(path.join(__dirname, '../client/dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, '../client/login.html'));
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});


// Register route
app.post('/register', (req, res) => {
    const { whatsapp_number, password } = req.body;

    if (!whatsapp_number || !password) {
        return res.status(400).json({ error: 'WhatsApp number and password are required' });
    }

    // Check if user already exists
    console.log(`[Register] Checking for user: ${whatsapp_number}`);
    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], (err, row) => {
        if (err) {
            console.error('[Register] DB Error (SELECT):', err);
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            console.log(`[Register] User already exists: ${whatsapp_number}`);
            return res.status(409).json({ error: 'User with this WhatsApp number already exists.' });
        }

        console.log(`[Register] User does not exist. Hashing password for: ${whatsapp_number}`);
        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.error("[Register] Bcrypt hash error:", err);
                return res.status(500).json({ error: 'Error hashing password' });
            }

            console.log(`[Register] Password hashed. Inserting new user: ${whatsapp_number}`);
            // Insert new user with hashed password
            db.run('INSERT INTO users (whatsapp_number, password) VALUES (?, ?)', [whatsapp_number, hash], function(err) {
                if (err) {
                    console.error('[Register] DB Error (INSERT):', err);
                    return res.status(500).json({ error: err.message });
                }
                console.log(`[Register] User registered successfully: ${whatsapp_number} with ID: ${this.lastID}`);
                res.status(201).json({ message: 'User registered successfully' });
            });
        });
    });
});


// Login route
app.post('/login', (req, res) => {
    const { whatsapp_number, password } = req.body;

    if (!whatsapp_number || !password) {
        return res.status(400).json({ error: 'WhatsApp number and password are required' });
    }

    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password with hash
        bcrypt.compare(password, user.password, (err, result) => {
            if (err || !result) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Passwords match, create JWT
            const userPayload = { id: user.id, whatsapp_number: user.whatsapp_number };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: false }).json({ message: 'Login successful' });
        });
    });
});

// Logout route
app.post('/logout', (req, res) => {
    res.clearCookie('token').json({ message: 'Logout successful' });
});

// Admin login route
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        const adminUser = { id: 0, username: 'admin' };
        const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false }).json({ message: 'Admin login successful' });
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
});

// Get API settings
app.get('/api/admin/settings', authenticateToken, (req, res) => {
  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  });
});

// Update API settings
app.post('/api/admin/settings', authenticateToken, (req, res) => {
  const { flutter_sdk_path } = req.body;
  // Since we only have one setting now, we can simplify this.
  // In a real app, you might loop through an array of keys.
  db.run("UPDATE settings SET value = ? WHERE key = 'flutter_sdk_path'", [flutter_sdk_path], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Settings updated successfully' });
  });
});

// Get all users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  db.all('SELECT id, whatsapp_number, app_limit FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update user app limit
app.post('/api/admin/users/:id/limit', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { limit } = req.body;
  db.run('UPDATE users SET app_limit = ? WHERE id = ?', [limit, id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User app limit updated successfully' });
  });
});

// Get user data
app.get('/api/user', authenticateToken, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        db.all('SELECT * FROM apps WHERE user_id = ?', [user.id], (err, apps) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ ...user, apps });
        });
    });
});

// Create app
app.post('/api/apps', authenticateToken, upload.single('app_icon'), (req, res) => {
    const { app_name, package_name, app_url } = req.body;
    const icon_path = path.resolve(req.file.path);
    const userId = req.user.id;

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        db.all('SELECT * FROM apps WHERE user_id = ?', [userId], (err, apps) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (apps.length >= user.app_limit) {
                return res.status(403).json({ error: 'App limit reached' });
            }
            db.run('INSERT INTO apps (user_id, app_name, package_name, app_url, icon_path, status) VALUES (?, ?, ?, ?, ?, ?)', [userId, app_name, package_name, app_url, icon_path, 'pending'], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const appId = this.lastID;
                console.log(`App creation started for app ID: ${appId}`);

                const flutterBuilder = spawn('node', [path.join(__dirname, '../flutter_builder/create_flutter_app.js'), appId]);

                flutterBuilder.stdout.on('data', (data) => {
                    console.log(`Flutter Builder: ${data}`);
                });

                flutterBuilder.stderr.on('data', (data) => {
                    console.error(`Flutter Builder Error: ${data}`);
                });

                flutterBuilder.on('close', (code) => {
                    console.log(`Flutter Builder process exited with code ${code}`);
                });

                res.json({ message: 'App creation process started' });
            });
        });
    });
});


// Download links
app.get('/download/:appId/:type', (req, res) => {
    const { appId, type } = req.params;
    db.get('SELECT * FROM apps WHERE id = ?', [appId], (err, app) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        const filePath = type === 'apk' ? app.apk_path : app.aab_path;
        if (!filePath) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(filePath);
    });
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
