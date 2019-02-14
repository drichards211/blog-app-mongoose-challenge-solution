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
        .then(function(res) {
          response = res;
          expect(response).to.have.status(200);
          expect(response.body).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(response.body).to.have.lengthOf(count);
        });
    });

    it('should return blog posts with correct fields', function() {
      let singlePost;
      return chai.request(app)
      .get('/posts')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.lengthOf.at.least(1);

        res.body.forEach(function(each) {
          expect(each).to.be.a('object');
          expect(each).to.include.keys(
            'id', 'title', 'content', 'author', 'created');
        });
        singlePost = res.body[0];
        return BlogPost.findById(singlePost.id);
      })
      .then(function(post) {
        expect(singlePost.title).to.equal(post.title);
        expect(singlePost.content).to.equal(post.content);
        expect(singlePost.author).to.equal(post.authorName);
      });
    });
  });

  describe('POST endpoint', function() {
    it('should add a new blog post', function() {
      const newPost = generateBlogData();

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'created', 'author', 'title', 'content');
          expect(res.body.title).to.equal(newPost.title);
          expect(res.body.id).to.not.be.null;
          expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
          expect(res.body.content).to.equal(newPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.title).to.equal(newPost.title);
          expect(post.content).to.equal(newPost.content);
          expect(post.author.firstName).to.equal(newPost.author.firstName);
          expect(post.author.lastName).to.equal(newPost.author.lastName);
        });
    });
  });

})

