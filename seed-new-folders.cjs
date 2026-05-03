const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const PUBLIC_ROOT = path.join(__dirname, '../frontend_repo/public');

const FOLDER_MAP = {
  'Plastic Spray - Lotion Pump': { 
    category: 'Plastic Sprayer', 
    desc: 'Durable plastic lotion pump providing consistent dosage and smooth operation for cosmetic and personal care products.' 
  },
  'Plastic Spray - Mist Spray': { 
    category: 'Plastic Sprayer', 
    desc: 'Fine-mist plastic sprayer designed for effortless application and even coverage. Suitable for body mists and hair care.' 
  },
  'Pump Without Collar': { 
    category: 'Pump & Collar', 
    desc: 'Discrete perfume pump without collar, designed for a modern "bare-neck" bottle aesthetic without compromising on spray quality.' 
  }
};

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const productsToInsert = [];

    for (const [folderName, info] of Object.entries(FOLDER_MAP)) {
      const folderPath = path.join(PUBLIC_ROOT, folderName);
      
      if (!fs.existsSync(folderPath)) {
        console.warn(`Folder not found: ${folderPath}`);
        continue;
      }

      const files = fs.readdirSync(folderPath);
      console.log(`Processing folder: ${folderName} (${files.length} files)`);

      for (const file of files) {
        if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
          let rawName = file.replace(/\.(png|jpg|jpeg)$/i, '').replace(/\s*\(.*?\)\s*/g, '').trim();
          
          // If name is just "1", "2", etc., make it more descriptive
          const displayName = isNaN(rawName) ? rawName : `${info.category} ${rawName}`;
          const professionalName = `${displayName} ${info.category}`;
          
          const slug = slugify(professionalName) + '-' + Math.random().toString(36).substring(2, 7);

          productsToInsert.push({
            name: professionalName,
            category: info.category,
            filter: info.category,
            description: info.desc,
            imageUrl: `/${folderName}/${file}`, // Relative to public
            size: 'N/A',
            slug: slug,
            pdfUrl: ''
          });
        }
      }
    }

    if (productsToInsert.length === 0) {
      console.log('No new products found to insert.');
    } else {
      console.log(`Found ${productsToInsert.length} products. Checking for duplicates...`);
      
      let insertedCount = 0;
      for (const productData of productsToInsert) {
        // Check if product with same imageUrl already exists to avoid duplicates
        const existing = await Product.findOne({ imageUrl: productData.imageUrl });
        if (!existing) {
          await Product.create(productData);
          insertedCount++;
        }
      }
      
      console.log(`Successfully added ${insertedCount} new products to the database.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seed();
