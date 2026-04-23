const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  purchaseDate: { type: Date },
  vendorName: { type: String },
  type: { type: String },
  price: { type: Number },
  warranty: { type: String },
  assetTag: { type: String },
  serialNo: { type: String }
});

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  allowedRoles: [{ type: String, enum: ['student', 'faculty', 'principal', 'guest'] }],
  assets: [assetSchema],
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hasAssetManagement: { type: Boolean, default: true }
});

module.exports = mongoose.model('Facility', facilitySchema);
