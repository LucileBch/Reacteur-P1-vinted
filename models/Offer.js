// ---------- OFFER Model ----------
// Import package (mongoose)
const mongoose = require(`mongoose`);

// Schema structure
const offerSchema = mongoose.Schema({
  product_name: { type: String, required: true, minLength: 1, maxLength: 50 },
  product_description: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 500,
  },
  product_price: { type: Number, required: true, min: 1, max: 100000 },
  product_details: { type: Array },
  product_image: { type: Object, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: `User`,
  },
});

// Export model
module.exports = mongoose.model(`Offer`, offerSchema);
