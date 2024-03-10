// ---------- OFFER Controllers ----------
// Import packages (cloudinary)
const cloudinary = require("cloudinary").v2;

// Import utils
const convertToBase64 = require(`../utils/conertToBase64`);

// Import models
const Offer = require(`../models/Offer`);
const User = require(`../models/User`);

// OFFERPUBLISH function
const offerPublish = async (req, res) => {
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
};

// Get all offers
const offersDisplay = async (req, res) => {
  try {
    // Destructuring
    const { title, priceMin, priceMax, sort, page } = req.query;

    // Object filters for title, priceMin & priceMax queries
    const filters = {};
    // Conditions
    if (title) {
      filters.product_name = new RegExp(title, `i`);
    }
    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }

    // Object sorter for sort query
    const sorter = {};
    // Conditions
    if (sort === `price-asc`) {
      sorter.product_price = `asc`;
    } else if (sort === `price-desc`) {
      sorter.product_price = `desc`;
    }

    // variable skiper for page query
    let skiper = 0;
    // Conditions testing page number
    if (page) {
      skiper = 5 * (page - 1);
    }

    // Displaying offers (5 per page)
    const offersToDisplay = await Offer.find(filters)
      .sort(sorter)
      .skip(skiper)
      .limit(5)
      .populate(`owner`, `account.username account.avatar.secure_url`);

    // Counter of offers
    const counter = await Offer.countDocuments(filters);

    return res.status(200).json({ counter, offersToDisplay });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export controllers
module.exports = { offerPublish, offersDisplay };
