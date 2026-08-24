const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  business: { type: String, required: true },
  description: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  location: { type: String, required: true },
  year: { type: Number, default: 2021 }
}, { timestamps: true });

module.exports = mongoose.model('SiteInfo', siteInfoSchema);
