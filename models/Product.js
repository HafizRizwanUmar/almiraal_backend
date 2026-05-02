const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  filter: { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  hoverImageUrl: { type: String, default: '' },
  specifications: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  size: { type: String, default: '100ml' },
  slug: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
