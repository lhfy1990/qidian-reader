var express = require('express');
var https = require('https');
var cheerio = require('cheerio');
var async = require('async');

var router_books = require('./apis/books.js');
var router_bookcases = require('./apis/bookcases.js');
var router_users = require('./apis/users.js');

// api
var router = express.Router();
// middleware to avoid router from stopping halfway
router.use((req, res, next) => {
  next();
});
router.get('/',
  (req, res) => {
    res.json({
      message: "hello, RESTful!"
    });
  });
router.route('/objects')
  .get((req, res) => {
    // query: /api/objects/?property=textValue&propertyarray=textValue0&propertyarray=textValue1
    var query = req.query;
    var objects = [];
    // if (query.isInvalid) 400 BAD REQUEST
    // if (isNoAuthIntormation) 401 UNAUTHORIZED
    // if (isNoRights) 403 FORBIDDEN
    var statusCode = 200; // 200 OK, no matter result is empty or not
    res.status(statusCode);
    res.json(objects);
  });
router.route('/objects/:objectId')
  .get((req, res) => {
    var objectId = req.params.objectId;
    var object = {};
    // if (objectId.isNotFound) 404 NOT FOUND
    // if (isNoAuthIntormation) 401 UNAUTHORIZED
    // if (isNoRights) 403 FORBIDDEN
    var statusCode = 200; // 200 OK
    res.status(statusCode);
    res.json(object);
  });
router.use('/books', router_books);
router.use('/bookcases', router_bookcases);
router.use('/users', router_users);

module.exports = router;