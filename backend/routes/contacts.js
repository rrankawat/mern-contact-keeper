const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const User = require('../models/User');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

// @route     GET /api/v1/contacts
// @desc      Get all users contacts
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id }).sort({
      date: -1,
    });

    res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route     GET /api/v1/contacts/:id
// @desc      Get Single contacts
// @access    Private
router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: `No contact found with the id ${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route     POST /api/v1/contacts
// @desc      Add new contact
// @access    Private
router.post(
  '/',
  [auth, [check('name', 'Name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, type } = req.body;

    try {
      const newContact = new Contact({
        name,
        email,
        phone,
        type,
        user: req.user._id,
      });

      const contact = await newContact.save();
      res.status(200).json({ success: true, data: contact });
    } catch (err) {
      res.status(500).send({ success: false, message: 'Server Error' });
    }
  }
);

// @route     PUT /api/v1/contacts/:id
// @desc      Update contact
// @access    Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, type } = req.body;

  // Build contact object
  const contactFields = {};

  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (phone) contactFields.phone = phone;
  if (type) contactFields.type = type;

  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `No contact found with the id ${req.params.id}`,
      });
    }

    // Make sure user owns contact
    if (contact.user.toString() !== req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized' });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        $set: contactFields,
      },
      {
        new: true,
      }
    );

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server Error' });
  }
});

// @route     DELETE api/contacts/:id
// @desc      Delete contact
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: 'Contact not found' });
    }

    // Make sure user owns contact
    if (contact.user.toString() !== req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized' });
    }

    await Contact.findByIdAndRemove(req.params.id);

    res.json({ success: true, message: 'Contact removed' });
  } catch (err) {
    res.status(500).send({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
