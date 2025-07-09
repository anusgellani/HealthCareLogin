const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456789',
  database: process.env.DB_NAME || 'healthcare_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(() => console.log('Connected to MySQL database'))
  .catch(err => console.error('Database connection failed:', err));

// Dashboard stats
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [medicalStaff] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role IN ("doctor", "nurse", "staff")');
    const [activePatients] = await pool.query('SELECT COUNT(*) as count FROM patients WHERE status = "active"');
    const [alerts] = await pool.query('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0');
    const [newUsersToday] = await pool.query('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()');
    const [doctors] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "doctor"');
    const [otherStaff] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role IN ("nurse", "staff")');
    const [criticalPatients] = await pool.query('SELECT COUNT(*) as count FROM patients WHERE status = "active" AND critical = 1');

    res.json({
      totalUsers: users[0].count,
      medicalStaff: medicalStaff[0].count,
      activePatients: activePatients[0].count,
      alerts: alerts[0].count,
      newUsersToday: newUsersToday[0].count,
      doctors: doctors[0].count,
      otherStaff: otherStaff[0].count - doctors[0].count,
      criticalPatients: criticalPatients[0].count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
});

// Patients endpoints
app.get('/api/patients', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT * FROM patients');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, age, gender, email, phone, address, medicalHistory, insurance, registrationDate } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO patients (name, age, gender, email, phone, address, medical_history, insurance, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
      [name, age, gender, email, phone, address, medicalHistory, insurance, registrationDate]
    );
    res.json({ id: result.insertId, ...req.body, registrationDate });
  } catch (error) {
    res.status(500).json({ error: 'Error adding patient' });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, gender, email, phone, address, medicalHistory, insurance } = req.body;
  try {
    await pool.query(
      'UPDATE patients SET name = ?, age = ?, gender = ?, email = ?, phone = ?, address = ?, medical_history = ?, insurance = ? WHERE id = ?',
      [name, age, gender, email, phone, address, medicalHistory, insurance, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating patient' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, role, password, phone } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, password, phone, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, role, password, phone]
    );
    res.json({ id: result.insertId, name, email, role, password, phone, created_at: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Error adding user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password, phone } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ?, password = ?, phone = ? WHERE id = ?',
      [name, email, role, password, phone, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length > 0) {
      if (['doctor', 'nurse', 'staff', 'administrator'].includes(users[0].role.toLowerCase())) {
        res.status(200).json({ success: true, user: users[0] });
      } else {
        res.status(403).json({ success: false, error: 'Access denied: Not authorized' });
      }
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Verify login endpoint
app.get('/api/verify-login/:userType', async (req, res) => {
  const { userType } = req.params;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE role = ?', [userType]);
    res.json({ success: users.length > 0, message: `${userType} login ${users.length > 0 ? 'verified' : 'failed'}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT * FROM patients');
    const [users] = await pool.query('SELECT * FROM users');
    res.json({ patientsCount: patients.length, usersCount: users.length, date: new Date().toLocaleString() });
  } catch (error) {
    res.status(500).json({ error: 'Error generating reports' });
  }
});

// Audit logs endpoint
app.get('/api/audit-logs', async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audit logs' });
  }
});

// Backup endpoint
app.get('/api/backup', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT * FROM patients');
    const [users] = await pool.query('SELECT * FROM users');
    res.json({ backup: { patients, users }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Error creating backup' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});