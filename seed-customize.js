const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CustomizeItem = require('./models/CustomizeItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/almiraal';

// Paths relative to project root (where script is run)
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'customize');

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await CustomizeItem.deleteMany({});
  console.log('Cleared existing items');

  const items = [];

  // 1. Bottles 100ml
  const b100Dir = path.join(PUBLIC_DIR, 'bottles-100ml');
  if (fs.existsSync(b100Dir)) {
    fs.readdirSync(b100Dir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'bottle',
          name: file.replace('.png', ''),
          size: '100ml',
          imageUrl: `/customize/bottles-100ml/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // 2. Bottles 50ml
  const b50Dir = path.join(PUBLIC_DIR, 'bottles-50ml');
  if (fs.existsSync(b50Dir)) {
    fs.readdirSync(b50Dir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'bottle',
          name: file.replace('.png', ''),
          size: '50ml',
          imageUrl: `/customize/bottles-50ml/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // 3. Caps
  const capsDir = path.join(PUBLIC_DIR, 'caps');
  if (fs.existsSync(capsDir)) {
    fs.readdirSync(capsDir).forEach(file => {
      if (file.endsWith('.png')) {
        items.push({
          type: 'cap',
          name: file.replace('.png', ''),
          imageUrl: `/customize/caps/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  // 4. Pumps
  const pumpsDir = path.join(PUBLIC_DIR, 'pumps');
  if (fs.existsSync(pumpsDir)) {
    fs.readdirSync(pumpsDir).forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpg')) {
        items.push({
          type: 'pump',
          name: file.replace('.png', '').replace('.jpg', ''),
          imageUrl: `/customize/pumps/${encodeURIComponent(file)}`,
          isActive: true
        });
      }
    });
  }

  if (items.length > 0) {
    await CustomizeItem.insertMany(items);
    console.log(`Successfully seeded ${items.length} items from filesystem.`);
  } else {
    console.warn('No items found to seed!');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(console.error);
