const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');

const CATALOG_ROOT = path.join(__dirname, '../frontend_repo/public/catalog_products');
const PDF_DIR = path.join(CATALOG_ROOT, 'pdfs');

const CATEGORY_MAP = {
  'perfume-bottle-set': 'Perfume Bottle Set',
  'perfume-bottle': 'Perfume Bottle',
  'perfume-cap': 'Perfume Cap',
  'pumps-collar': 'Pump & Collar',
  'mini-set': 'Mini Set',
  'diffuser': 'Diffuser',
  'plastic-spray': 'Plastic Sprayer',
  'serum-bottle': 'Serum Bottle',
  'cream-jar': 'Cream Jar',
  'car-perfume': 'Car Perfume',
  'screw-neck': 'Screw Neck Bottle'
};

const FILTER_KEYWORDS = ['clear', 'frosted', 'gold', 'silver', 'black', 'white', 'matte', 'colored', 'ice', 'blue', 'green', 'orange', 'gray', 'brown', 'transparent', 'lotion', 'mist', 'trigger'];
const SIZE_KEYWORDS = ['10ml', '12ml', '15ml', '20ml', '30ml', '35ml', '40ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml', '1l', '2l'];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    await Product.deleteMany({});
    console.log('Cleared existing products.');

    // Since I already reorganized once, I need to walk the directory recursively to find all images
    const productsToInsert = [];

    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          if (file !== 'pdfs') walkDir(filePath);
          continue;
        }
        if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

        // Extract metadata from filename and path
        const relativePath = path.relative(CATALOG_ROOT, filePath).replace(/\\/g, '/');
        
        let category = 'Perfume Bottle';
        let categorySlug = 'perfume-bottle';
        for (const [slug, name] of Object.entries(CATEGORY_MAP)) {
          if (relativePath.includes(slug)) {
            category = name;
            categorySlug = slug;
            break;
          }
        }

        let fileName = file.replace(/\.(png|jpg|jpeg)$/i, '');
        let namePart = fileName;
        let suffix = '';
        const suffixMatch = namePart.match(/-(\d+)$/);
        if (suffixMatch) {
          suffix = suffixMatch[1];
          namePart = namePart.replace(/-(\d+)$/, '');
        }

        // Detect Filter
        let filter = category;
        for (const kw of FILTER_KEYWORDS) {
          if (fileName.toLowerCase().includes(kw)) {
            filter = kw.charAt(0).toUpperCase() + kw.slice(1);
            break;
          }
        }

        // Detect Size
        let size = 'N/A';
        for (const kw of SIZE_KEYWORDS) {
          if (fileName.toLowerCase().includes(kw)) {
            size = kw;
            break;
          }
        }

        // Determine Product Name
        // If it's already in a subfolder, use the subfolder name as product name
        const pathParts = relativePath.split('/');
        let productName = 'Generic';
        if (pathParts.length >= 3) {
           productName = pathParts[1].replace(/-/g, ' ');
        } else {
           productName = namePart.replace(new RegExp(`-${categorySlug}`, 'g'), '').replace(/-/g, ' ').trim();
        }
        
        const professionalName = `${productName.charAt(0).toUpperCase() + productName.slice(1)} ${category}`;

        productsToInsert.push({
          name: professionalName,
          category,
          filter: filter,
          description: `Premium ${professionalName} available in ${size} capacity. Ideal for luxury fragrance and cosmetic packaging.`,
          imageUrl: `/catalog_products/${relativePath}`,
          size: size,
          slug: slugify(professionalName) + '-' + Math.random().toString(36).substring(2, 7),
          pdfUrl: ''
        });
      }
    }

    walkDir(CATALOG_ROOT);

    // Handle PDFs
    if (fs.existsSync(PDF_DIR)) {
      const pdfFiles = fs.readdirSync(PDF_DIR);
      for (const pdf of pdfFiles) {
        let coreName = pdf
          .replace(/^\d+_/, '') 
          .replace(/-model.*$/, '')
          .replace(/\.pdf.*$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ' ')
          .trim();
        
        for (const product of productsToInsert) {
          // Fuzzy match: if core name is a word in the product name
          if (product.name.toLowerCase().includes(coreName)) {
            product.pdfUrl = `/catalog_products/pdfs/${pdf}`;
          }
        }
      }
    }

    // Insert into DB
    const chunkSize = 100;
    for (let i = 0; i < productsToInsert.length; i += chunkSize) {
      const chunk = productsToInsert.slice(i, i + chunkSize);
      await Product.insertMany(chunk);
      console.log(`Inserted chunk ${i / chunkSize + 1}`);
    }

    console.log(`Successfully seeded ${productsToInsert.length} products with filters.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
