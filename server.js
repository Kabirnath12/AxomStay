const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { google } = require('google-auth-library');
const twilio = require('twilio');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'axomstay-local-development-secret';
const dataPath = path.join(__dirname, 'data', 'store.json');
const uploadsPath = path.join(__dirname, 'uploads');
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? require('stripe')(stripeSecret) : null;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const twilioConfigError = twilioAccountSid && !/^AC[a-zA-Z0-9]{32}$/.test(twilioAccountSid);
const twilioClient = twilioAccountSid && twilioAuthToken && !twilioConfigError ? twilio(twilioAccountSid, twilioAuthToken) : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth/otp', rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(__dirname));

function readStore() {
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}
function writeStore(store) {
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}
function safeUser(user) {
  const roles = user.roles || [user.role];
  return { id: user.id, name: user.name, email: user.email, role: roles[0], roles };
}
function signUser(user) {
  const roles = user.roles || [user.role];
  return jwt.sign({ id: user.id, roles, role: roles[0] }, JWT_SECRET, { expiresIn: '7d' });
}
function findOrCreateGoogleUser(profile) {
  const store = readStore();
  let user = store.users.find((item) => item.googleId === profile.sub || item.email === profile.email.toLowerCase());
  if (!user) {
    user = { id: crypto.randomUUID(), name: profile.name || profile.email.split('@')[0], email: profile.email.toLowerCase(), googleId: profile.sub, role: 'guest', roles: ['guest'], createdAt: new Date().toISOString() };
    store.users.push(user);
  } else {
    user.googleId = profile.sub;
    user.roles = user.roles || [user.role];
  }
  writeStore(store);
  return user;
}
function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    try {
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      req.auth = jwt.verify(token, JWT_SECRET);
      const roles = req.auth.roles || [req.auth.role];
      if (requiredRole && !roles.includes(requiredRole)) return res.status(403).json({ error: 'Add the ' + requiredRole + ' role to this account first.' });
      next();
    } catch {
      res.status(401).json({ error: 'Please sign in to continue.' });
    }
  };
}

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'axomstay' }));

const upload = multer({
  dest: uploadsPath,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, callback) => callback(null, /image\/(jpeg|png|webp)/.test(file.mimetype))
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'guest' } = req.body;
  if (!name || !email || !password || !['guest', 'host'].includes(role)) return res.status(400).json({ error: 'Name, email, password, and a valid role are required.' });
  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = store.users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    if (!(await bcrypt.compare(password, existingUser.passwordHash))) return res.status(409).json({ error: 'That email is already registered. Use the same password to add another role.' });
    existingUser.roles = [...new Set([...(existingUser.roles || [existingUser.role]), role])];
    existingUser.role = existingUser.roles[0];
    writeStore(store);
    return res.status(200).json({ token: signUser(existingUser), user: safeUser(existingUser), message: `The ${role} role was added to your account.` });
  }
  const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role, roles: [role], createdAt: new Date().toISOString() };
  store.users.push(user);
  writeStore(store);
  res.status(201).json({ token: signUser(user), user: safeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.email === String(req.body.email || '').trim().toLowerCase());
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: signUser(user), user: safeUser(user) });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.email === String(req.body.email || '').trim().toLowerCase());
  if (!user) return res.json({ message: 'If that email is registered, a reset code has been sent.' });
  user.resetToken = String(Math.floor(100000 + Math.random() * 900000));
  user.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;
  writeStore(store);
  res.json({ message: 'Reset code generated. Check your email in production.', demoCode: process.env.NODE_ENV === 'production' ? undefined : user.resetToken });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.email === String(req.body.email || '').trim().toLowerCase());
  if (!user || user.resetToken !== String(req.body.code || '') || user.resetTokenExpiresAt < Date.now()) return res.status(400).json({ error: 'That reset code is invalid or expired.' });
  user.passwordHash = await bcrypt.hash(req.body.password || '', 12);
  delete user.resetToken;
  delete user.resetTokenExpiresAt;
  writeStore(store);
  res.json({ message: 'Password updated. You can now sign in.' });
});

app.post('/api/auth/otp/request', async (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  if (phone.length < 10) return res.status(400).json({ error: 'Enter a valid mobile number.' });
  if (twilioConfigError) return res.status(503).json({ error: 'Twilio is configured incorrectly. TWILIO_ACCOUNT_SID must start with AC and be copied from the Twilio Console.' });
  const store = readStore();
  let user = store.users.find((item) => item.phone === phone);
  if (!user) {
    user = { id: crypto.randomUUID(), name: req.body.name || 'AxomStay guest', email: `${phone}@phone.axomstay.local`, phone, role: 'guest', roles: ['guest'], passwordHash: '', createdAt: new Date().toISOString() };
    store.users.push(user);
  }
  user.otpCode = String(Math.floor(100000 + Math.random() * 900000));
  user.otpExpiresAt = Date.now() + 5 * 60 * 1000;
  if (twilioClient) {
    if (!twilioFromNumber && !twilioMessagingServiceSid) return res.status(503).json({ error: 'Configure TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.' });
    try {
      const message = { body: `Your AxomStay verification code is ${user.otpCode}. It expires in 5 minutes.`, to: `+${phone}` };
      if (twilioMessagingServiceSid) message.messagingServiceSid = twilioMessagingServiceSid;
      else message.from = twilioFromNumber;
      await twilioClient.messages.create(message);
    } catch {
      return res.status(502).json({ error: 'Twilio could not deliver the OTP. Check your number and Twilio configuration.' });
    }
  }
  writeStore(store);
  res.json({ message: twilioClient ? 'OTP sent to your mobile.' : 'Demo OTP generated. Add Twilio credentials for SMS delivery.', demoCode: twilioClient || process.env.NODE_ENV === 'production' ? undefined : user.otpCode });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  const store = readStore();
  const user = store.users.find((item) => item.phone === phone);
  if (!user || user.otpCode !== String(req.body.code || '') || user.otpExpiresAt < Date.now()) return res.status(400).json({ error: 'That OTP is invalid or expired.' });
  delete user.otpCode;
  delete user.otpExpiresAt;
  writeStore(store);
  res.json({ token: signUser(user), user: safeUser(user) });
});

app.get('/api/auth/google', (req, res) => {
  if (!googleClientId || !googleClientSecret) return res.status(503).send('Gmail login needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.');
  const client = new google.auth.OAuth2(googleClientId, googleClientSecret, googleRedirectUri);
  const url = client.generateAuthUrl({ access_type: 'offline', scope: ['openid', 'email', 'profile'], prompt: 'select_account' });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  if (!googleClientId || !googleClientSecret || !req.query.code) return res.redirect('/?googleError=not-configured');
  try {
    const client = new google.auth.OAuth2(googleClientId, googleClientSecret, googleRedirectUri);
    const { tokens } = await client.getToken(req.query.code);
    client.setCredentials(tokens);
    const profile = await client.request({ url: 'https://openidconnect.googleapis.com/v1/userinfo' });
    const user = findOrCreateGoogleUser(profile.data);
    res.redirect(`/?googleToken=${encodeURIComponent(signUser(user))}`);
  } catch {
    res.redirect('/?googleError=failed');
  }
});

app.get('/api/me', auth(), (req, res) => {
  const user = readStore().users.find((item) => item.id === req.auth.id);
  res.json({ user: safeUser(user) });
});

app.get('/api/properties', (req, res) => {
  const requestedArea = String(req.query.area || '').trim().toLowerCase();
  const properties = readStore().properties.filter((property) => property.status === 'published' && (!requestedArea || String(property.area || property.location.split(',')[0]).toLowerCase() === requestedArea));
  res.json({ properties });
});

app.post('/api/properties', auth('host'), upload.single('image'), (req, res) => {
  const { title, location, description, price, guests } = req.body;
  if (!title || !location || !price || !guests) return res.status(400).json({ error: 'Title, location, nightly price, and guest capacity are required.' });
  const store = readStore();
  const area = String(req.body.area || location.split(',')[0]).trim();
  const property = { id: crypto.randomUUID(), hostId: req.auth.id, title: title.trim(), location: location.trim(), area, description: description || '', price: Number(price), guests: Number(guests), image: req.file ? '/uploads/' + req.file.filename : 'images/kaziranga-hero.jpg', status: 'published', createdAt: new Date().toISOString() };
  store.properties.push(property);
  writeStore(store);
  res.status(201).json({ property });
});

app.get('/api/host/properties', auth('host'), (req, res) => res.json({ properties: readStore().properties.filter((property) => property.hostId === req.auth.id) }));

app.post('/api/bookings', auth('guest'), (req, res) => {
  const { propertyId, checkIn, checkOut, guests } = req.body;
  const store = readStore();
  const property = store.properties.find((item) => item.id === propertyId && item.status === 'published');
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end - start) / 86400000);
  if (!property || !checkIn || !checkOut || nights < 1 || Number(guests) < 1 || Number(guests) > property.guests) return res.status(400).json({ error: 'Choose valid dates and guests for this property.' });
  const booking = { id: crypto.randomUUID(), userId: req.auth.id, hostId: property.hostId, propertyId, propertyTitle: property.title, checkIn, checkOut, guests: Number(guests), nights, total: nights * property.price, status: 'awaiting_payment', createdAt: new Date().toISOString() };
  store.bookings.push(booking);
  writeStore(store);
  res.status(201).json({ booking });
});

app.get('/api/bookings', auth(), (req, res) => {
  const roles = req.auth.roles || [req.auth.role];
  const bookings = readStore().bookings.filter((booking) => (roles.includes('guest') && booking.userId === req.auth.id) || (roles.includes('host') && booking.hostId === req.auth.id));
  res.json({ bookings });
});

app.post('/api/payments/checkout', auth('guest'), async (req, res) => {
  const store = readStore();
  const booking = store.bookings.find((item) => item.id === req.body.bookingId && item.userId === req.auth.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  const paymentMethod = ['card', 'upi', 'netbanking', 'wallet'].includes(req.body.paymentMethod) ? req.body.paymentMethod : 'card';
  if (stripe) {
    if (!['card', 'upi'].includes(paymentMethod)) return res.status(400).json({ error: 'This payment method is not enabled for live checkout yet. Choose card or UPI.' });
    const session = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: [paymentMethod], line_items: [{ price_data: { currency: 'inr', product_data: { name: booking.propertyTitle }, unit_amount: booking.total * 100 }, quantity: 1 }], success_url: `${req.protocol}://${req.get('host')}/?payment=success&booking=${booking.id}`, cancel_url: `${req.protocol}://${req.get('host')}/?payment=cancelled` });
    return res.json({ mode: 'stripe', url: session.url });
  }
  booking.status = 'paid';
  booking.paidAt = new Date().toISOString();
  booking.paymentMethod = paymentMethod;
  store.payments.push({ id: crypto.randomUUID(), bookingId: booking.id, amount: booking.total, method: paymentMethod, mode: 'demo', status: 'paid', createdAt: new Date().toISOString() });
  writeStore(store);
  res.json({ mode: 'demo', booking, message: `Demo ${paymentMethod} payment successful. Add STRIPE_SECRET_KEY for live payments.` });
});

app.listen(PORT, () => console.log(`AxomStay is running at http://localhost:${PORT}`));
