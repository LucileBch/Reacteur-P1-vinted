// ---------- OFFER Routing ----------
// Import packages (express, express-fileupload,)
const express = require(`express`);
const router = express.Router();
const fileUpload = require(`express-fileupload`);

// Import offer controllers
const offerCtrl = require(`../controllers/offer`);

// Import middleware
const authentication = require(`../middleware/authentication`);

// ---------- Routes POST ----------
// Publish an offer
router.post(
  `/offer/publish`,
  authentication,
  fileUpload(),
  offerCtrl.offerPublish
);

// ---------- Routes GET ----------
// Display offers with Filter, Sort and Organize by query
router.get(`/offers`, offerCtrl.offersDisplay);
// Display offer by Id
router.get(`/offers/:id`, offerCtrl.displayOfferById);

// Export route
module.exports = router;
