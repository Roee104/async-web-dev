'use strict';

/**
 * @file user.js
 * @description Mongoose schema for 'users' collection
 */

const mongoose = require('mongoose');

/**
 * userSchema fields:
 *  - id, first_name, last_name, birthday, marital_status
 *  - totalCost (for the computed pattern)
 */
const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  birthday: { type: Date },
  marital_status: { type: String },
  totalCost: { type: Number, default: 0 }
}, { collection: 'users' });

/**
 * We name our constructor function capital 'User'.
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
