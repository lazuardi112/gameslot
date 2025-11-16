const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const db = require('./database');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));


const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register route
app.post('/register', (req, res) => {
  const { whatsapp_number } = req.body;

  if (!whatsapp_number) {
    return res.status(400).json({ error: 'WhatsApp number is required' });
  }

  const otp = generateOTP();

  // Check if user exists, if so update OTP, otherwise insert new user
  db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      db.run('UPDATE users SET otp = ? WHERE whatsapp_number = ?', [otp, whatsapp_number], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
      });
    } else {
      db.run('INSERT INTO users (whatsapp_number, otp) VALUES (?, ?)', [whatsapp_number, otp], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
      });
    }

    // Send OTP via WhatsApp
    db.get('SELECT value FROM settings WHERE key = ?', ['api_key'], (err, apiKeyRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT value FROM settings WHERE key = ?', ['device_id'], (err, deviceIdRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const apiKey = apiKeyRow.value;
        const deviceId = deviceIdRow.value;

        if (!apiKey || !deviceId) {
            return res.status(500).json({ error: 'API key or device ID not configured in admin panel' });
        }

        const data = JSON.stringify({
          "deviceId": deviceId,
          "to": whatsapp_number,
          "message": `Your OTP is: ${otp}`
        });

        const config = {
          method: 'post',
          url: 'https://xcd.xcreate.my.id/api/v1/message/send-text',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          data: data
        };

        axios(config)
          .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json({ message: 'OTP sent successfully' });
          })
          .catch(function (error) {
            console.log(error);
            res.status(500).json({ error: 'Failed to send OTP' });
          });
      });
    });
  });
});


// Login route
app.post('/login', (req, res) => {
  const { whatsapp_number, otp } = req.body;

  if (!whatsapp_number || !otp) {
    return res.status(400).json({ error: 'WhatsApp number and OTP are required' });
  }

  db.get('SELECT * FROM users WHERE whatsapp_number = ? AND otp = ?', [whatsapp_number, otp], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Here you would typically create a session or JWT
      res.json({ message: 'Login successful', user: { id: row.id, whatsapp_number: row.whatsapp_number } });
    } else {
      res.status(401).json({ error: 'Invalid OTP' });
    }
  });
});

// Admin login route
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ message: 'Admin login successful' });
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
});

// Get API settings
app.get('/api/admin/settings', (req, res) => {
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
app.post('/api/admin/settings', (req, res) => {
  const { api_key, device_id } = req.body;
  db.run("UPDATE settings SET value = ? WHERE key = 'api_key'", [api_key], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.run("UPDATE settings SET value = ? WHERE key = 'device_id'", [device_id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Settings updated successfully' });
    });
  });
});

// Get all users
app.get('/api/admin/users', (req, res) => {
  db.all('SELECT id, whatsapp_number, app_limit FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update user app limit
app.post('/api/admin/users/:id/limit', (req, res) => {
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
app.get('/api/user/:whatsapp_number', (req, res) => {
    const { whatsapp_number } = req.params;
    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], (err, user) => {
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
app.post('/api/apps', upload.single('app_icon'), (req, res) => {
    const { whatsapp_number, app_name, package_name, app_url } = req.body;
    const icon_path = req.file.path;

    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], (err, user) => {
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
            if (apps.length >= user.app_limit) {
                return res.status(403).json({ error: 'App limit reached' });
            }
            db.run('INSERT INTO apps (user_id, app_name, package_name, app_url, icon_path, status) VALUES (?, ?, ?, ?, ?, ?)', [user.id, app_name, package_name, app_url, icon_path, 'pending'], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const appId = this.lastID;
                console.log(`App creation started for app ID: ${appId}`);

                const flutterBuilder = spawn('node', ['../flutter_builder/create_flutter_app.js', appId]);

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
