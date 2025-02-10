'use strict';

/**
 * @file app.js
 * @description Main Express server setup + MongoDB connection
 */

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();

// Suppress Mongoose strictQuery deprecation warning
mongoose.set('strictQuery', false);

// Use bodyParser to parse JSON in request bodies
app.use(bodyParser.json());

const mongoUri = 'mongodb+srv://roee104:AtVW3e61tgfPoG6r@cluster0.mru5p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB Atlas');

    // Ensure one default user (id=123123)
    const User = require('./models/user');
    const existing = await User.findOne({ id: '123123' });
    if (!existing) {
      await new User({
        id: '123123',
        first_name: 'mosh',
        last_name: 'israeli',
        birthday: new Date('1990-01-01'),
        marital_status: 'single'
        // totalCost defaults to 0
      }).save();
      console.log('Default user created.');
    } else {
      console.log('Default user already exists.');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Use all /api routes
app.use('/api', apiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// If this file is the entry point, start server
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('Server running on port ' + port);
  });
}

// Export app for tests
module.exports = app;
