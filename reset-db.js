const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const CustomizeItem = require('./models/CustomizeItem');
const Quote = require('./models/Quote');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/almiraal';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function reset() {
  console.log('Starting Database Reset...');
  
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Local MongoDB');

  // 1. Drop Database
  await mongoose.connection.db.dropDatabase();
  console.log('Dropped "almiraal" database');

  // 2. Seed Customize Items (Dynamic from filesystem)
  const items = [];
  const custDir = path.join(PUBLIC_DIR, 'customize');

  // Bottles 100ml
  const b100Dir = path.join(custDir, 'bottles-100ml');
  if (fs.existsSync(b100Dir)) {
    fs.readdirSync(b100Dir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'bottle', name: file.replace('.png', ''), size: '100ml',
          imageUrl: `/customize/bottles-100ml/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // Bottles 50ml
  const b50Dir = path.join(custDir, 'bottles-50ml');
  if (fs.existsSync(b50Dir)) {
    fs.readdirSync(b50Dir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'bottle', name: file.replace('.png', ''), size: '50ml',
          imageUrl: `/customize/bottles-50ml/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // Caps
  const capsDir = path.join(custDir, 'caps');
  if (fs.existsSync(capsDir)) {
    fs.readdirSync(capsDir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'cap', name: file.replace('.png', ''),
          imageUrl: `/customize/caps/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // Pumps
  const pumpsDir = path.join(custDir, 'pumps');
  if (fs.existsSync(pumpsDir)) {
    fs.readdirSync(pumpsDir).forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpg')) {
        items.push({
          type: 'pump', name: file.replace('.png', '').replace('.jpg', ''),
          imageUrl: `/customize/pumps/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  if (items.length > 0) {
    await CustomizeItem.insertMany(items);
    console.log(`Seeded ${items.length} Customize Items.`);
  }

  // 3. Seed Sample Products
  const products = [
    {
      name: 'Luxury Gold Serum Bottle',
      category: 'Serum Bottles',
      filter: 'Serum Bottles',
      description: 'Premium glass serum bottle with gold pump.',
      imageUrl: '/SerumBottles/serum-1.png',
      specifications: '30ml / 50ml capacity'
    },
    {
      name: 'Frosted Cream Jar',
      category: 'Cream Jars',
      filter: 'Cream Jars',
      description: 'Elegant frosted glass jar for high-end creams.',
      imageUrl: '/CreamJars/jar-1.png',
      specifications: '50g capacity'
    },
    {
      name: 'Classic Perfume Bottle',
      category: 'Perfume Bottles',
      filter: 'Perfume Bottles',
      description: 'Timeless rectangular glass bottle.',
      imageUrl: '/bottles/perfume-1.png',
      specifications: '100ml / 50ml'
    }
  ];

  // Try to find real files for products if they exist
  const serumFiles = fs.existsSync(path.join(PUBLIC_DIR, 'SerumBottles')) ? fs.readdirSync(path.join(PUBLIC_DIR, 'SerumBottles')) : [];
  if (serumFiles.length > 0) {
    products[0].imageUrl = `/SerumBottles/${serumFiles[0]}`;
  }

  const jarFiles = fs.existsSync(path.join(PUBLIC_DIR, 'CreamJars')) ? fs.readdirSync(path.join(PUBLIC_DIR, 'CreamJars')) : [];
  if (jarFiles.length > 0) {
    products[1].imageUrl = `/CreamJars/${jarFiles[0]}`;
  }

  await Product.insertMany(products);
  console.log(`Seeded ${products.length} Sample Products.`);

  await mongoose.disconnect();
  console.log('Database Reset and Seeding Complete.');
}

reset().catch(console.error);
