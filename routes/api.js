let express = require('express');
let https = require('https');
let cheerio = require('cheerio');
let async = require('async');

let router_books = require('./apis/books.js');
let router_bookcases = require('./apis/bookcases.js');
let router_users = require('./apis/users.js');

// api
let router = express.Router();
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
    let query = req.query;
    let objects = [];
    // if (query.isInvalid) 400 BAD REQUEST
    // if (isNoAuthIntormation) 401 UNAUTHORIZED
    // if (isNoRights) 403 FORBIDDEN
    let statusCode = 200; // 200 OK, no matter result is empty or not
    res.status(statusCode);
    res.json(objects);
  });
router.route('/objects/:objectId')
  .get((req, res) => {
    let objectId = req.params.objectId;
    let object = {};
    // if (objectId.isNotFound) 404 NOT FOUND
    // if (isNoAuthIntormation) 401 UNAUTHORIZED
    // if (isNoRights) 403 FORBIDDEN
    let statusCode = 200; // 200 OK
    res.status(statusCode);
    res.json(object);
  });
router.use('/books', router_books);
router.use('/bookcases', router_bookcases);
router.use('/users', router_users);

module.exports = router;