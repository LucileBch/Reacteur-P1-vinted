// ---------- OFFER Routing ----------
// Import packages (express, express-fileupload, cloudinary)
const express = require(`express`);
const router = express.Router();
const fileUpload = require(`express-fileupload`);
const cloudinary = require("cloudinary").v2;

// Import middleware
const authentication = require(`../middleware/authentication`);

// Import utils
const convertToBase64 = require(`../utils/conertToBase64`);

// Import models
const Offer = require(`../models/Offer`);
const User = require(`../models/User`);

// ---------- Routes POST ----------
// Creating an offer
router.post(
  `/offer/publish`,
  authentication,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      // Finding user with token
      const userId = await User.findOne({ token: req.user.token });

      // Excluding condition if:
      //    user not authenticated
      //    price > 100.000
      //    title > 50 charact or description > 500 charact
      if (!userId) {
        return res.status(401).json({ message: `Unauthorized` });
      }

      if (price > 100000) {
        return res
          .status(401)
          .json({ message: `The price can not superate 100.000` });
      }

      if (title.length > 50 || description.length > 500) {
        return res.status(401).json({
          message: `Please respect 50 characters for title and 500 characters for description`,
        });
      }

      // Create new Offer
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: {},
        owner: userId.id,
      });

      // Convert picture
      // Upload picture to cloudinary specific folder
      const convertedFile = convertToBase64(req.files.picture);
      const uploadResult = await cloudinary.uploader.upload(convertedFile, {
        folder: `vinted/offers/${newOffer.id}`,
      });
      newOffer.product_image = uploadResult;

      await newOffer.save();

      res.status(200).json({
        _id: newOffer.id,
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: newOffer.product_details,
        owner: {
          account: {
            username: userId.account.username,
            avatar: userId.account.avatar,
          },
          _id: userId.id,
        },
        product_image: newOffer.product_image,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Export route
module.exports = router;
