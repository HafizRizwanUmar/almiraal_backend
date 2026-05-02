const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const Product = require('./models/Product');
const CustomizeItem = require('./models/CustomizeItem');
const Quote = require('./models/Quote');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'almiraal_uploads',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'pdf']
  },
});

const upload = multer({ storage });

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Return the secure URL from Cloudinary
  res.json({ url: req.file.path });
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Al Miraal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email Error:', err);
  }
};

/* ════════════════════════════════════
   PRODUCTS
   (URLs match slug structure: /products/:slug)
════════════════════════════════════ */
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier) && (new String(identifier).length === 24);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    
    const product = await Product.findOne(query);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('Incoming product data:', req.body);
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { 
    console.error('Product Creation Error:', err.message);
    res.status(400).json({ error: err.message }); 
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    console.log('DELETE request for product ID:', req.params.id);
    const result = await Product.findByIdAndDelete(req.params.id);
    console.log('Delete result:', result);
    res.json({ message: 'Product deleted' });
  } catch (err) { 
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

/* ════════════════════════════════════
   CUSTOMIZE ITEMS
════════════════════════════════════ */
app.get('/api/customize-items', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const items = await CustomizeItem.find(query).sort({ sortOrder: 1, createdAt: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customize-items', async (req, res) => {
  try {
    const item = new CustomizeItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/customize-items/:id', async (req, res) => {
  try {
    const item = await CustomizeItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/customize-items/:id', async (req, res) => {
  try {
    console.log('DELETE request for customize-item ID:', req.params.id);
    const result = await CustomizeItem.findByIdAndDelete(req.params.id);
    console.log('Delete result:', result);
    res.json({ message: 'Item deleted' });
  } catch (err) { 
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

/* ════════════════════════════════════
   CONTACT FORM
════════════════════════════════════ */
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  try {
    // 1. Notify Admin
    await sendEmail(
      process.env.RECEIVER_EMAIL,
      `New Contact Inquiry from ${name}`,
      `<h3>New Contact Message</h3>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Phone:</strong> ${phone}</p>
       <p><strong>Message:</strong><br/>${message}</p>`
    );

    // 2. Confirmation to User
    await sendEmail(
      email,
      'Thank you for contacting Al Miraal',
      `<h3>Hello ${name},</h3>
       <p>Thank you for reaching out to Al Miraal. We have received your message and our team will get back to you shortly.</p>
       <p>Best Regards,<br/>Al Miraal Team</p>`
    );

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/* ════════════════════════════════════
   QUOTES
════════════════════════════════════ */
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/quotes', async (req, res) => {
  try {
    const quote = new Quote(req.body);
    await quote.save();

    // Notify Admin
    await sendEmail(
      process.env.RECEIVER_EMAIL,
      `New Quote Request: ${quote.bottleName}`,
      `<h3>New Quote Request</h3>
       <p><strong>Customer:</strong> ${quote.customerName}</p>
       <p><strong>Email:</strong> ${quote.email}</p>
       <p><strong>Phone:</strong> ${quote.phone}</p>
       <p><strong>Total Quantity:</strong> ${quote.quantity}</p>
       <hr/>
       <h4>Configuration & Individual Quantities:</h4>
       <p><strong>Bottle:</strong> ${quote.bottleName} (${quote.bottleSize}) - Qty: ${quote.bottleQty}</p>
       {quote.pumpName && <p><strong>Pump:</strong> ${quote.pumpName} - Qty: ${quote.pumpQty}</p>}
       {quote.capName && <p><strong>Cap:</strong> ${quote.capName} - Qty: ${quote.capQty}</p>}`
    );

    // Confirmation to User
    await sendEmail(
      quote.email,
      'Your Al Miraal Quote Request',
      `<h3>Hello ${quote.customerName},</h3>
       <p>Thank you for your interest in Al Miraal products. We have received your quote request for the <strong>${quote.bottleName}</strong> configuration.</p>
       <p>Our team will review your requirements and send a formal quote to your email shortly.</p>
       <p>Best Regards,<br/>Al Miraal Team</p>`
    );

    res.status(201).json(quote);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/quotes/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(quote);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
