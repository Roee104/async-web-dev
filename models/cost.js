'use strict';

/**
 * @file cost.js
 * @description Mongoose schema for 'costs' collection
 */

const mongoose = require('mongoose');

const validCategories = ['food', 'health', 'housing', 'sport', 'education'];

/**
 * costSchema fields:
 *   - description, category, userid, sum, created_at
 *   - category must be one of 5 valid categories
 *   - created_at defaults to current date/time
 */
const costSchema = new mongoose.Schema({
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: validCategories
  },
  userid: { type: String, required: true },
  sum: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'costs' });

const Cost = mongoose.model('Cost', costSchema);

module.exports = Cost;
