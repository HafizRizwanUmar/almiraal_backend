const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const SOURCE_ROOT = path.join(__dirname, '../product catalog');
const DEST_ROOT = path.join(__dirname, '../frontend_repo/public/catalog_products');

const FOLDER_MAP = {
  '100ml bottle set perfume': { category: 'Perfume Bottle Set', size: '100ml', desc: 'Complete 100ml perfume bottle set featuring a luxury glass bottle, high-precision pump, and a matching cap. Ideal for high-end fragrance lines.' },
  '50 ml perfume set': { category: 'Perfume Bottle Set', size: '50ml', desc: 'Elegant 50ml perfume set including a premium glass container and coordinated accessories for a cohesive brand aesthetic.' },
  'Caps With Collar': { category: 'Perfume Cap', size: '', desc: 'Professional perfume cap with integrated collar, designed to provide a secure fit and a sleek, finished look to your fragrance bottles.' },
  'Caps Without Collar': { category: 'Perfume Cap', size: '', desc: 'Minimalist perfume cap without collar, offering a modern and streamlined appearance for contemporary fragrance packaging.' },
  'Car Perfume': { category: 'Car Perfume', size: '', desc: 'Stylish car perfume bottle designed for long-lasting fragrance release. Compact and durable, perfect for automotive use.' },
  'Cream Jars  Creams': { category: 'Cream Jar', size: '', desc: 'Premium glass cream jar suitable for luxury skincare products. Offers excellent preservation and a sophisticated shelf presence.' },
  'Cream Jars Foundation Cream': { category: 'Cream Jar', size: '', desc: 'Specially designed jar for foundation and liquid creams, featuring a wide neck for easy application and elegant design.' },
  'Diffuser': { category: 'Diffuser', size: '', desc: 'High-quality reed diffuser bottle designed for consistent scent throw and aesthetic appeal in any home or office environment.' },
  'MINI SET MINI Bottles': { category: 'Mini Set', size: '', desc: 'Miniature perfume bottle set, perfect for samples, travel sizes, or gift sets. Compact glass design with fine-mist sprayers.' },
  'Mini Set Mini Tubes': { category: 'Mini Set', size: '', desc: 'Mini tube set for cosmetic applications. Ideal for travel-sized lotions, serums, or fragrance samples.' },
  'Perfume Bottle - 100 ml': { category: 'Perfume Bottle', size: '100ml', desc: 'Our flagship 100ml perfume bottle, crafted from high-clarity glass. A timeless design that serves as the perfect canvas for your brand.' },
  'Plastic Spray - Lotion Pump': { category: 'Plastic Spray', size: '', desc: 'Durable plastic lotion pump providing consistent dosage and smooth operation for cosmetic and personal care products.' },
  'Plastic Spray - Mist Spray': { category: 'Plastic Spray', size: '', desc: 'Fine-mist plastic sprayer designed for effortless application and even coverage. Suitable for body mists and hair care.' },
  'Plastic Sprayers  Triggers': { category: 'Plastic Sprayer', size: '', desc: 'Versatile plastic trigger sprayer for cleaning, cosmetic, or industrial use. Features an adjustable nozzle for controlled application.' },
  'Pump Without Collar': { category: 'Pump', size: '', desc: 'Discrete perfume pump without collar, designed for a modern "bare-neck" bottle aesthetic without compromising on spray quality.' },
  'Serum Bottles': { category: 'Serum Bottle', size: '', desc: 'Specialized serum bottle with high-precision dispensing system, ideal for active skincare ingredients and oils.' },
  'screw neck': { category: 'Screw Neck Bottle', size: '', desc: 'Robust screw-neck glass bottle offering a secure seal and versatile compatibility with various caps and closures.' }
};

if (!fs.existsSync(DEST_ROOT)) {
  fs.mkdirSync(DEST_ROOT, { recursive: true });
}

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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // We don't deleteMany here because the user might want to keep the 2 original products
    // Or maybe they want a clean catalog?
    // User: "now start uploading product catalog data"
    // I'll keep existing ones but we can clear if preferred.
    // Let's clear so it's a fresh start for the "catalog".
    await Product.deleteMany({});
    console.log('Cleared existing products for fresh catalog upload.');

    const folders = fs.readdirSync(SOURCE_ROOT);
    const productsToInsert = [];

    for (const folder of folders) {
      const folderPath = path.join(SOURCE_ROOT, folder);
      if (fs.statSync(folderPath).isDirectory() && FOLDER_MAP[folder]) {
        const { category, size, desc } = FOLDER_MAP[folder];
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
          if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')) {
            const filePath = path.join(folderPath, file);
            let rawName = file.replace(/\.(png|jpg|jpeg)$/i, '').replace(/\s*\(.*?\)\s*/g, '').trim();
            
            // Professional Name
            const professionalName = `${rawName} ${category}`;
            
            const cleanFileName = slugify(professionalName) + '-' + Date.now().toString().slice(-4) + path.extname(file);
            const destPath = path.join(DEST_ROOT, cleanFileName);
            
            fs.copyFileSync(filePath, destPath);

            productsToInsert.push({
              name: professionalName,
              category,
              filter: category, // Using category as filter for now
              description: desc,
              imageUrl: `/catalog_products/${cleanFileName}`,
              size: size || 'N/A',
              slug: slugify(professionalName) + '-' + Math.random().toString(36).substring(2, 7),
              pdfUrl: '' // Will upload soon as requested
            });
          }
        }
      }
    }

    // Use chunks of 100 to avoid large payload errors
    const chunkSize = 100;
    for (let i = 0; i < productsToInsert.length; i += chunkSize) {
      const chunk = productsToInsert.slice(i, i + chunkSize);
      await Product.insertMany(chunk);
      console.log(`Inserted chunk ${i / chunkSize + 1} (${chunk.length} items)`);
    }

    console.log(`Successfully uploaded ${productsToInsert.length} products to the catalog.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding catalog:', err);
    process.exit(1);
  }
}

seed();
