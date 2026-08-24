const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Enquiry = require('./models/Enquiry');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'new-horizon-farm-mern' });
});

app.get('/api/site-info', (_req, res) => {
  res.json({
    name: 'New Horizon Farm',
    business: 'Guwahati Cab Services',
    description: 'Trusted cab rides and farm stay hospitality in Assam.',
    phone: '+91 60039 15793',
    whatsapp: 'https://wa.me/916003915793',
    location: 'Silpukhuri, Sarania Hills, Guwahati, Assam, India',
    year: 2021
  });
});

app.post('/api/enquiries', async (req, res) => {
  try {
    const { name, phone, message, type = 'general', pickup, destination, travelDate, passengers } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Name, phone, and message are required' });
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
      type,
      pickup,
      destination,
      travelDate,
      passengers: passengers ? Number(passengers) : undefined
    });

    res.status(201).json({ message: 'Enquiry received', enquiry });
  } catch (error) {
    console.error('Enquiry creation failed:', error.message);
    res.status(500).json({ error: 'Unable to save enquiry' });
  }
});

app.get('/api/enquiries', async (req, res) => {
  if (!process.env.ADMIN_KEY || req.get('x-admin-key') !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Admin key required' });
  }

  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ enquiries });
  } catch (error) {
    console.error('Enquiry lookup failed:', error.message);
    res.status(500).json({ error: 'Unable to load enquiries' });
  }
});

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/new-horizon-farm';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
};

connectDB();

app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
