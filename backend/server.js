const express = require('express');
const connectDB = require('../config/db');
const cors = require('cors');

const app = express();

// Connect database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Enable CORS
app.use(cors());

app.get('/', (req, res) => res.json({ msg: 'Welcome to Contact Keeper API' }));

// Define Routes
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/contacts', require('./routes/contacts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
