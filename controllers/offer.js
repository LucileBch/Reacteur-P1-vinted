// ---------- OFFER Controllers ----------
// Import packages (cloudinary)
const cloudinary = require("cloudinary").v2;

// Import utils
const convertToBase64 = require(`../utils/conertToBase64`);

// Import models
const Offer = require(`../models/Offer`);
const User = require(`../models/User`);

// ---------- POST ----------
// publish offer
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

// ---------- GET ----------
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

// Get offer by id
const displayOfferById = async (req, res) => {
  try {
    let offerToDisplay = await Offer.findById(req.params.id)
      .populate(`owner`, `account.username account.avatar.secure_url`)
      .select(
        `product_name product_description product_details product_price product_image.secure_url
      `
      );

    res.status(200).json(offerToDisplay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- PUT ----------
// Update offer by id /!\/!\ FINIR DE GERER product_details
const updateOffer = async (req, res) => {
  try {
    // Find user with token
    const userId = await User.findOne({ token: req.user.token });
    // Get owner'Id
    const offerRef = await Offer.findById(req.params.id).populate(`owner`);
    const ownerID = offerRef.owner.id;

    // Excluding condition if user !== ownerId
    if (userId.id !== ownerID) {
      return res.status(401).json({ message: `Unauthorized` });
    }

    // Destructuring `body` parameters
    const {
      product_name,
      product_description,
      product_price,
      product_details,
    } = req.body;

    // Testing if new image to upload
    // Delete old image from Cloudinary
    if (req.files.product_image) {
      await cloudinary.uploader.destroy(offerRef.product_image.public_id);
    }
    // Convert new image
    // Upload new image to cloudinary specific folder
    const convertedFile = convertToBase64(req.files.product_image);
    const uploadResult = await cloudinary.uploader.upload(convertedFile, {
      folder: `vinted/offers/${offerRef.id}`,
    });

    const offerToUpdate = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        product_name,
        product_description,
        product_price,
        //product_details, // renvoyer tous les élements, sinon écrase le tableau pour new tableau avec que le nombre d'éléments qu'il y a dans le body
        product_image: uploadResult,
      },
      { new: true }
    );

    await offerToUpdate.save();
    res.status(202).json(offerToUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- DELETE ----------
// Delete offer by id
const deleteOfferById = async (req, res) => {
  try {
    // Find user with token
    const userId = await User.findOne({ token: req.user.token });
    // Get owner'Id
    const offerRef = await Offer.findById(req.params.id).populate(`owner`);
    const ownerID = offerRef.owner.id;

    // Excluding condition if user !== ownerId
    if (userId.id !== ownerID) {
      return res.status(401).json({ message: `Unauthorized` });
    }

    // Delete offer from DB
    const offerToDelete = await Offer.findByIdAndDelete(req.params.id);
    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(offerToDelete.product_image.public_id);
    // Delete empty folder from Cloudinary
    await cloudinary.api.delete_folder(offerToDelete.product_image.folder);
    res.status(202).json({ message: `This offer has been deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export controllers
module.exports = {
  offerPublish,
  offersDisplay,
  displayOfferById,
  updateOffer,
  deleteOfferById,
};
