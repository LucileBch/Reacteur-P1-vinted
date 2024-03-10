// ---------- AUTHENTICATION Middleware ----------
// Import model
const User = require(`../models/User`);

// Testing token sent with token user registered
const authentication = async (req, res, next) => {
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.split(` `)[1],
    });

    if (!user) {
      return res.status(401).json({ error: `Unauthorized` });
    } else {
      req.user = user;
      return next();
    }
  } else {
    return res.status(401).json({ error: `Unauthorized` });
  }
};

// Export middleware
module.exports = authentication;
