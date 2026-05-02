const mongoose = require('mongoose');

const CustomizeItemSchema = new mongoose.Schema({
  type:     { type: String, required: true, enum: ['bottle', 'cap', 'pump'] },
  name:     { type: String, required: true },
  size:     { type: String, default: '' },   // e.g. '100ml', '50ml'
  imageUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  sortOrder:{ type: Number, default: 0 },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomizeItem', CustomizeItemSchema);
