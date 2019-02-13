'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
  console.info('seeding blog data');
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push(generateBlogData());
  }
  return BlogPost.insertMany(seedData);
}

function generateAuthorName() {
  const author = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName()
  }
  return author;
}

function generateTitle() {
  return faker.lorem.sentence()
}

function generateContent() {
  return faker.lorem.text();
}

function generateBlogData() {
  return {
    author: generateAuthorName(),
    title: generateTitle(),
  content: generateContent()
  }
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blogs API resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all existing blog posts', function() {
      let response;
      return chai.request(app)
        .get('/posts')
        .then(function(r) {
          response = r;
          expect(response).to.have.status(200);
          expect(response.body.posts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(response.body.posts).to.have.lengthOf(count);
        });
    });
  });

})

