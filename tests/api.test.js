'use strict';

/**
 * @file api.test.js
 * @description Unit tests for each endpoint using Mocha + Chai + chai-http
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const mongoose = require('mongoose');
const Cost = require('../models/cost');
const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Cost Manager RESTful Web Services', function() {
  this.timeout(10000);

  // default user
  const testUserId = '123123';

  const basePath = '/api';

  // Connect to DB before tests
  before(async () => {
    const mongoUri = 'mongodb+srv://roee104:AtVW3e61tgfPoG6r@cluster0.mru5p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Test DB connected');
    }
  });

  // Clear costs & reset user totalCost each test
  beforeEach(async () => {
    await Cost.deleteMany({});
    await User.updateOne({ id: testUserId }, { totalCost: 0 });
  });

  // Disconnect after all tests
  after(async () => {
    await mongoose.connection.close();
  });

  // Tests for POST /api/add
  describe('POST /api/add', () => {
    it('should add a new cost item and update user totalCost', async () => {
      const costData = {
        userid: testUserId,
        description: 'milk 9',
        category: 'food',
        sum: 8
      };
      const res = await chai.request(app).post(`${basePath}/add`).send(costData);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('description', 'milk 9');
      expect(res.body).to.have.property('category', 'food');
      expect(res.body).to.have.property('sum', 8);

      // Check user totalCost updated
      const updatedUser = await User.findOne({ id: testUserId });
      expect(updatedUser.totalCost).to.equal(8);
    });

    it('should return error if user does not exist', async () => {
      const costData = {
        userid: '999999',
        description: 'milk 9',
        category: 'food',
        sum: 8
      };
      const res = await chai.request(app).post(`${basePath}/add`).send(costData);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });

    it('should return error if required fields missing', async () => {
      const costData = {
        userid: testUserId,
        description: 'milk 9'
        // missing category & sum
      };
      const res = await chai.request(app).post(`${basePath}/add`).send(costData);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });
  });

  // Tests for GET /api/report
  describe('GET /api/report', () => {
    it('should get monthly report grouped by category', async () => {
      // Insert a cost in January 2025
      const sampleCost = new Cost({
        userid: testUserId,
        description: 'bread',
        category: 'food',
        sum: 12,
        created_at: new Date(2025, 0, 10)
      });
      await sampleCost.save();

      const res = await chai.request(app)
        .get(`${basePath}/report?id=${testUserId}&year=2025&month=1`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('userid', testUserId);
      expect(res.body).to.have.property('year', 2025);
      expect(res.body).to.have.property('month', 1);
      expect(res.body).to.have.property('costs').that.is.an('array');

      const foodObj = res.body.costs.find(cat => Object.keys(cat)[0] === 'food');
      expect(foodObj).to.exist;
      expect(foodObj.food).to.have.lengthOf(1);
      expect(foodObj.food[0]).to.have.property('sum', 12);
      expect(foodObj.food[0]).to.have.property('description', 'bread');
      expect(foodObj.food[0]).to.have.property('day', 10);
    });

    it('should return empty arrays if no costs found', async () => {
      const res = await chai.request(app)
        .get(`${basePath}/report?id=${testUserId}&year=2025&month=1`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('costs').that.is.an('array');
      const foodObj = res.body.costs.find(cat => Object.keys(cat)[0] === 'food');
      expect(foodObj.food).to.be.empty;
    });
  });

  // Tests for GET /api/users/:id
  describe('GET /api/users/:id', () => {
    it('should get user details with total cost', async () => {
      // Insert a cost, update user's totalCost
      const cost = new Cost({
        userid: testUserId,
        description: 'health check',
        category: 'health',
        sum: 25
      });
      await cost.save();

      await User.updateOne({ id: testUserId }, { totalCost: 25 });

      const res = await chai.request(app).get(`${basePath}/users/${testUserId}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('id', '123123');
      expect(res.body).to.have.property('first_name', 'mosh');
      expect(res.body).to.have.property('last_name', 'israeli');
      expect(res.body).to.have.property('total', 25);
    });

    it('should return error if user does not exist', async () => {
      const res = await chai.request(app).get(`${basePath}/users/999999`);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });
  });

  // Tests for GET /api/about
  describe('GET /api/about', () => {
    it('should return array of team members with first_name, last_name only', async () => {
      const res = await chai.request(app).get(`${basePath}/about`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');

      // Must have { first_name, last_name } only
      const dev = res.body[0];
      expect(dev).to.have.property('first_name');
      expect(dev).to.have.property('last_name');
      expect(Object.keys(dev)).to.have.lengthOf(2);
    });
  });
});
