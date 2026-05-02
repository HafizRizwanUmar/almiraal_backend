const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const Product = require('./models/Product');
const CustomizeItem = require('./models/CustomizeItem');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const items = [
  // BOTTLES
  { type: 'bottle', name: 'Elegant Square', size: '100ml', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650000/bottles/square-100.png', isActive: true },
  { type: 'bottle', name: 'Classic Round', size: '100ml', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650001/bottles/round-100.png', isActive: true },
  { type: 'bottle', name: 'Modern Slim', size: '100ml', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650002/bottles/slim-100.png', isActive: true },
  { type: 'bottle', name: 'Elegant Square', size: '50ml', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650003/bottles/square-50.png', isActive: true },
  { type: 'bottle', name: 'Classic Round', size: '50ml', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650004/bottles/round-50.png', isActive: true },

  // CAPS
  { type: 'cap', name: 'Luxury Gold Cap', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650005/caps/gold-cap.png', isActive: true },
  { type: 'cap', name: 'Sleek Silver Cap', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650006/caps/silver-cap.png', isActive: true },
  { type: 'cap', name: 'Matte Black Cap', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650007/caps/black-cap.png', isActive: true },

  // PUMPS
  { type: 'pump', name: 'Gold Spray Pump', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650008/pumps/gold-pump.png', isActive: true },
  { type: 'pump', name: 'Silver Spray Pump', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650009/pumps/silver-pump.png', isActive: true },
  { type: 'pump', name: 'Black Spray Pump', imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650010/pumps/black-pump.png', isActive: true },
];

const products = [
  {
    name: 'Royal Oud Fragrance Bottle',
    category: 'Perfume Bottles',
    filter: 'Premium',
    description: 'A luxurious heavy-base glass bottle designed for premium oriental fragrances.',
    imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650011/products/royal-oud.jpg',
    size: '100ml',
    pdfUrl: ''
  },
  {
    name: 'Azure Mist Serum Bottle',
    category: 'Serum Bottles',
    filter: 'Serum Bottles',
    description: 'Sleek frosted blue bottle with high-precision pump for serums and oils.',
    imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650012/products/azure-mist.jpg',
    size: '50ml',
    pdfUrl: ''
  }
];

const populate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to Atlas');

    // Clear existing
    await CustomizeItem.deleteMany({});
    await Product.deleteMany({});

    // Insert items
    await CustomizeItem.insertMany(items);
    await Product.insertMany(products);

    console.log('Population complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

populate();
