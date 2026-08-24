const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['general', 'ride', 'farm-stay'], default: 'general' },
  pickup: { type: String, trim: true },
  destination: { type: String, trim: true },
  travelDate: { type: String, trim: true },
  passengers: { type: Number, min: 1 },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);