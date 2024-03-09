// ---------- USER Model ----------
// Import package (mongoose)
const mongoose = require(`mongoose`);

// Schema structure
const userSchema = mongoose.Schema({
  email: { type: String, required: true },
  account: {
    username: { type: String, required: true },
    avatar: { type: Object },
  },
  newsletter: { type: Boolean },
  token: { type: String, required: true },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
});

// Export model
module.exports = mongoose.model(`User`, userSchema);
