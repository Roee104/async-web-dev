'use strict';

/**
 * @file api.js
 * @description Defines the REST endpoints for /add, /report, /users/:id, /about
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Cost = require('../models/cost');

/**
 * POST /api/add
 * Required: { description, category, userid, sum, [created_at?] }
 * If user not found -> error
 * Otherwise -> saves cost, updates user's totalCost, returns saved cost
 */
router.post('/add', async (req, res) => {
  try {
    // De-structure required fields from request body
    const { description, category, userid, sum, created_at } = req.body;

    // Validate all mandatory fields are present
    if (!description || !category || !userid || sum === undefined) {
      return res.status(400).json({ error: 'Missing required fields: description, category, userid, sum' });
    }

    // Check if the user with this ID actually exists
    const user = await User.findOne({ id: userid });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Create a new cost object with either provided created_at or default date
    const newCost = new Cost({
      description,
      category,
      userid,
      sum,
      created_at: created_at ? new Date(created_at) : undefined
    });

    // Save the cost item in the 'costs' collection
    const savedCost = await newCost.save();

    // Update totalCost in the user (computed pattern)
    // By storing totalCost in 'user', we avoid recalculating it every time
    user.totalCost += sum;
    await user.save();

    // Return the newly created cost item in JSON
    return res.json(savedCost);
  } catch (err) {

    // Catch any other errors (e.g. DB connectivity, etc.) and respond with 400
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/report?id=...&year=...&month=...
 * Returns all costs for user in that year/month, grouped by category
 * If no costs found, each category array is empty
 */
router.get('/report', async (req, res) => {
  try {

    // Extract query params for user ID, year, and month
    const { id, year, month } = req.query;
    if (!id || !year || !month) {
      return res.status(400).json({ error: 'Missing query params: id, year, month' });
    }

    // Convert year/month to integers
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    // Check for invalid or out-of-range values
    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Construct date range for the specified month
    // startDate is the 1st day, endDate is the 1st day of next month
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 1);

    // Find all cost items that match user ID and date range
    const costs = await Cost.find({
      userid: id,
      created_at: { $gte: startDate, $lt: endDate }
    });

    // Predefine 5 categories to ensure empty arrays if nothing is found
    const categories = ['food', 'health', 'housing', 'sport', 'education'];
    const grouped = {};

    // Initialize empty arrays for each category in our grouping object
    for (const cat of categories) {
      grouped[cat] = [];
    }

    // For each cost item, push an object { sum, description, day } into the appropriate category array
    costs.forEach(cost => {
      const dayOfMonth = cost.created_at.getDate();
      grouped[cost.category].push({
        sum: cost.sum,
        description: cost.description,
        day: dayOfMonth
      });
    });

    // Convert our grouped object into an array of objects [{food: [...]}, {health: [...]}, ...]
    const costsArray = categories.map(cat => ({ [cat]: grouped[cat] }));

    // Return final structure with user ID, year, month, and the grouped costs
    return res.json({
      userid: id,
      year: yearInt,
      month: monthInt,
      costs: costsArray
    });
  } catch (err) {
    // Catch any runtime or DB errors
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/users/:id
 * Returns { id, first_name, last_name, total } for that user
 */
router.get('/users/:id', async (req, res) => {
  try {
    // :id is extracted from route parameters
    const userId = req.params.id;

    // Attempt to find the user by their 'id' field
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Return only the fields: id, first_name, last_name, and total
    return res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      total: user.totalCost
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/about
 * Returns an array of { first_name, last_name } for dev team
 */
router.get('/about', (req, res) => {
  try {
    // Hard-coded array for the dev team
    const team = [
      { first_name: 'Roee', last_name: 'Levi' },
      { first_name: 'Omer', last_name: 'Trabulski'}
    ];
    return res.json(team);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
