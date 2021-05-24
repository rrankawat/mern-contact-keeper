const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const brcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../models/User');

// @route     POST /api/v1/users
// @desc      Register a user
// @access    Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is not valid').isEmail(),
    check('password', 'Password should have 6 or more characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ success: false, message: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await brcrypt.genSalt(10);
      user.password = await brcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          _id: user._id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 3600 * 24,
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ success: true, token });
        }
      );
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

module.exports = router;
