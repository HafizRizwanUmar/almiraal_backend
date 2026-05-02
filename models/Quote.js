const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  // Bottle config
  bottleName: { type: String, default: '' },
  bottleSize: { type: String, default: '' },
  bottleImage:{ type: String, default: '' },
  capName:    { type: String, default: '' },
  capImage:   { type: String, default: '' },
  pumpName:   { type: String, default: '' },
  pumpImage:  { type: String, default: '' },
  // Customer info
  quantity:     { type: Number, default: 1 },
  bottleQty:    { type: Number, default: 0 },
  capQty:       { type: Number, default: 0 },
  pumpQty:      { type: Number, default: 0 },
  customerName: { type: String, required: true },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  message:      { type: String, default: '' },
  // Status
  status: { type: String, default: 'pending', enum: ['pending', 'reviewed', 'closed'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quote', QuoteSchema);
