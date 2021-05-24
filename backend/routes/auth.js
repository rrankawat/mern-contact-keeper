const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const brcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../models/User');
const auth = require('../middleware/auth');

// @route     GET /api/v1/auth
// @desc      Get logged in user
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route     POST /api/v1/auth
// @desc      Auth user & get token
// @access    Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: `User with email '${email}' does not exists`,
        });
      }

      const isMatch = await brcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: 'Password do not match' });
      }

      const payload = {
        user: {
          _id: user._id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 3600 * 24 * 30,
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
