const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');

const PDF_DIR = path.join(__dirname, '../frontend_repo/public/catalog_products/pdfs');

async function analyze() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf') || f.endsWith('.pdf.pdf'));
    const products = await Product.find({}, 'name slug');

    console.log(`Found ${pdfFiles.length} PDFs and ${products.length} products.`);

    const mapping = [];
    const unmatchedPdfs = [];

    pdfFiles.forEach(pdf => {
      // Extract core name
      // Example: 102_bell-model.pdf.pdf -> bell
      // Example: 10_foundation_bottle_gold_-_gold-model.pdf.pdf -> foundation_bottle_gold_-_gold
      let coreName = pdf
        .replace(/^\d+_/, '') // Remove number prefix
        .replace(/-model.*$/, '') // Remove -model and anything after
        .replace(/\.pdf.*$/, '') // Remove extensions
        .toLowerCase()
        .replace(/_/g, '-') // Normalize underscores to dashes
        .trim();

      const matchedProducts = products.filter(p => {
        const productName = p.name.toLowerCase().replace(/_/g, '-');
        return productName.includes(coreName);
      });

      if (matchedProducts.length > 0) {
        mapping.push({
          pdf,
          coreName,
          matchedCount: matchedProducts.length,
          matches: matchedProducts.map(p => p.name).slice(0, 3)
        });
      } else {
        unmatchedPdfs.push({ pdf, coreName });
      }
    });

    console.log('\n--- Sample Matches ---');
    mapping.slice(0, 10).forEach(m => {
      console.log(`PDF: ${m.pdf} -> Core: ${m.coreName} -> Matches: ${m.matches.join(', ')} (${m.matchedCount} total)`);
    });

    console.log(`\nMatched ${mapping.length} out of ${pdfFiles.length} PDFs.`);
    console.log(`Unmatched PDFs: ${unmatchedPdfs.length}`);
    if (unmatchedPdfs.length > 0) {
      console.log('Sample Unmatched:', unmatchedPdfs.slice(0, 5).map(u => u.pdf).join(', '));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

analyze();
