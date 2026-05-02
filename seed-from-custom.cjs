const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const CustomizeItem = require('./models/CustomizeItem');

dotenv.config();

const SOURCE_DIR = path.join(__dirname, '../customize_bottle_data');
const DEST_DIR = path.join(__dirname, '../public/custom_products');

// Map directories to Categories/Types and Sizes
const DIR_MAP = {
  'CUSTOM BOTTLE 100ML': { type: 'bottle', size: '100ml' },
  'CUSTOM perfume bottle 50 ml': { type: 'bottle', size: '50ml' },
  'CUSTOM CAPS': { type: 'cap', size: 'N/A' },
  'pumps': { type: 'pump', size: 'N/A' }
};

// Ensure dest dir exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const originalProducts = [
  {
    name: 'Royal Oud Fragrance Bottle',
    category: 'Perfume Bottle',
    filter: 'Premium',
    description: 'A luxurious heavy-base glass bottle designed for premium oriental fragrances.',
    imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650011/products/royal-oud.jpg',
    size: '100ml',
    slug: 'royal-oud-fragrance-bottle'
  },
  {
    name: 'Azure Mist Serum Bottle',
    category: 'Serum Bottle',
    filter: 'Serum Bottles',
    description: 'Sleek frosted blue bottle with high-precision pump for serums and oils.',
    imageUrl: 'https://res.cloudinary.com/dhmaitldj/image/upload/v1714650012/products/azure-mist.jpg',
    size: '50ml',
    slug: 'azure-mist-serum-bottle'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Reset Products to original set
    await Product.deleteMany({});
    await Product.insertMany(originalProducts);
    console.log('Reset Product Catalog to original items.');

    // Clear and Populated CustomizeItems
    await CustomizeItem.deleteMany({});
    console.log('Cleared old custom assets');

    const dirs = fs.readdirSync(SOURCE_DIR);
    const itemsToInsert = [];

    for (const dir of dirs) {
      const fullDirPath = path.join(SOURCE_DIR, dir);
      if (fs.statSync(fullDirPath).isDirectory() && DIR_MAP[dir]) {
        const files = fs.readdirSync(fullDirPath);
        
        for (const file of files) {
          if (file.toLowerCase().endsWith('.png')) {
            const filePath = path.join(fullDirPath, file);
            let baseName = file.replace(/\.png$/i, '');
            const cleanFileName = slugify(baseName) + '-' + Date.now().toString().slice(-4) + '.png';
            const destPath = path.join(DEST_DIR, cleanFileName);
            
            fs.copyFileSync(filePath, destPath);
            
            const { type, size } = DIR_MAP[dir];

            itemsToInsert.push({
              name: baseName,
              type,
              size: size === 'N/A' ? '' : size,
              imageUrl: `/custom_products/${cleanFileName}`,
              isActive: true
            });
          }
        }
      }
    }

    await CustomizeItem.insertMany(itemsToInsert);
    console.log(`Inserted ${itemsToInsert.length} custom assets successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
