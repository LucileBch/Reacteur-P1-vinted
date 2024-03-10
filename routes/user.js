// ---------- USER Routing ----------
// Import packages (express, crypto-js, uid2, express-fileupload, cloudinary)
const express = require(`express`);
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require(`crypto-js/enc-base64`);
const uid2 = require("uid2");
const fileUpload = require(`express-fileupload`);
const cloudinary = require(`cloudinary`).v2;

// Import middleware
const authentication = require(`../middleware/authentication`);

// Import utils
const convertToBase64 = require(`../utils/conertToBase64`);

// Import models
const Offer = require(`../models/Offer`);
const User = require(`../models/User`);

// ---------- Routes POST ----------
// SignUp : creating new User
router.post(`/user/signup`, fileUpload(), async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;

    // Excluding condition if:
    //      email already exists
    //      email, username or password is missing
    const emailToCheck = await User.findOne({ email });
    if (emailToCheck) {
      return res.status(400).json({ message: `This email already exists` });
    }

    if (!username || !email || !password) {
      return res.status(401).json({
        message: `Please make sure to fill the fields email, username and password`,
      });
    }

    // Encrypting password
    const saltPassword = uid2(16);
    const hashPassword = SHA256(password + saltPassword).toString(encBase64);
    const token = uid2(32);

    // Create new User
    const newUser = new User({
      email: email,
      account: {
        username: username,
        avatar: {},
      },
      newsletter: newsletter,
      token: token,
      hash: hashPassword,
      salt: saltPassword,
    });

    // Converting avatar
    const convertedAvatar = convertToBase64(req.files.avatar);
    // Uploading avatar to cloudinary specific folder
    const uploadAvatar = await cloudinary.uploader.upload(convertedAvatar, {
      folder: `vinted/users/${newUser.id}`,
    });
    newUser.account.avatar = uploadAvatar;

    await newUser.save();

    res.status(201).json({
      _id: newUser.id,
      token: newUser.token,
      account: { username: username },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post(`/user/login`, async (req, res) => {
  try {
    // Excluding condition if email field is empty
    if (!req.body.email) {
      return res
        .status(400)
        .json({ message: `Please enter your email adress!` });
    }

    // Excluding condition if email field is empty
    const userToFind = await User.findOne({ email: req.body.email });
    if (!userToFind) {
      return res.status(400).json({ message: `Email or password incorrect` });
    }

    // Testing password correspondance
    const hashToCheck = SHA256(req.body.password + userToFind.salt).toString(
      encBase64
    );

    if (hashToCheck === userToFind.hash) {
      res.status(202).json({
        _id: userToFind.id,
        token: userToFind.token,
        account: { username: userToFind.account.username },
      });
    } else {
      res.status(401).json({ message: `Email or password incorrect` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export route
module.exports = router;
