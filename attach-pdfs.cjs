const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');

const PDF_DIR = path.join(__dirname, '../frontend_repo/public/catalog_products/pdfs');

function normalize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function updatePdfs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf') || f.endsWith('.pdf.pdf'));
    console.log(`Processing ${pdfFiles.length} PDFs...`);

    const products = await Product.find({});
    console.log(`Found ${products.length} products in DB.`);

    let updatedCount = 0;
    const pdfMap = new Map();

    // Pre-process PDFs
    pdfFiles.forEach(pdf => {
      let coreName = pdf
        .replace(/^\d+_/, '') 
        .replace(/-model.*$/, '')
        .replace(/\.pdf.*$/, '');
      
      const normalizedCore = normalize(coreName);
      pdfMap.set(normalizedCore, pdf);
    });

    for (const product of products) {
      const normalizedName = normalize(product.name);
      const words = normalizedName.split(' ');
      
      let matchedPdf = null;
      
      // Strategy 1: Check if any core name (normalized) matches exactly a word in product name
      for (const [normCore, pdf] of pdfMap.entries()) {
        if (words.includes(normCore)) {
          matchedPdf = pdf;
          break;
        }
      }
      
      // Strategy 2: If no word match, check if core name is contained in product name
      if (!matchedPdf) {
        for (const [normCore, pdf] of pdfMap.entries()) {
          if (normalizedName.includes(normCore) && normCore.length > 3) {
            matchedPdf = pdf;
            break;
          }
        }
      }

      if (matchedPdf) {
        product.pdfUrl = `/catalog_products/pdfs/${matchedPdf}`;
        await product.save();
        updatedCount++;
      }
    }

    console.log(`Successfully attached PDFs to ${updatedCount} product records.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updatePdfs();
