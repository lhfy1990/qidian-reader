var express = require('express');
var https = require('https');
var cheerio = require('cheerio');
var async = require('async');
var mongoose = require('mongoose');
var userModel = mongoose.model('User');
var bookcaseModel = mongoose.model('Bookcase');

var router = express.Router();
router.route('/')
    .get((req, res) => {
        // query: /api/objects/?property=textValue&propertyarray=textValue0&propertyarray=textValue1
        var query = req.query;
        var options = {};
        Object.keys(query).forEach((elk, ik, ak) => {
            if (Array.isArray(query[elk])) {
                // TODO: handle non string fields here
                options[elk] = { '$in': query[elk] };
            } else {
                // TODO: handle non string fields here
                options[elk] = query[elk];
            }
        });
        bookcaseModel.find(options).exec((err, bookcases) => {
            if (err) {
                res.status(400);
                res.json();
            } else {
                res.status(200);
                res.json(bookcases);
            }
        });
        // if (query.isInvalid) 400 BAD REQUEST
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        // 200 OK, no matter result is empty or not
    })
    .post((req, res) => {
        // TODO: no RESTful
        var body = req.body;
        if (typeof body.userId === 'undefined') {
            res.status(400);
            res.json();
        } else {
            async.waterfall([
                (callback) => {
                    bookcaseModel.create(body.bookcase ? body.bookcase : {}, (err, bookcase) => {
                        if (err) {
                            // TODO: handle 400, 407 error
                            callback(err, null);
                        } else {
                            callback(null, bookcase);
                        }
                    });
                },
                (bookcase, callback) => {
                    userModel.findByIdAndUpdate(body.userId, { '$push': { bookcases: bookcase._id } }).exec((err, raw) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, bookcase);
                        }
                    });
                }
            ], (err, bookcase) => {
                if (err) {
                    // TODO: handle 400, 407 error
                    res.status(400);
                    res.json();
                } else {
                    res.status(201);
                    res.json(bookcase);
                }
            });
        }
    })
    .put(function(req, res) {
        // not allowed, unless you want to update/replace every resource in the entire collection
        var statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .patch(function(req, res) {
        // not allowed, unless you want to update/modify every resource in the entire collection
        var statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .delete(function(req, res) {
        // not allowed, unless you want to delete the whole collection—not often desirable
        var statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    });
router.route('/:bookcaseId')
    .get((req, res) => {
        var bookcaseId = req.params.bookcaseId;
        bookcaseModel.findById(bookcaseId).populate('books').exec((err, bookcase) => {
            if (err) {
                res.status(400);
                res.json();
            } else {
                res.status(200);
                res.json(bookcase);
            }
        });
    })
    .post(function(req, res) {
        // not allowed
        var statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .put(function(req, res) {
        var bookcaseId = req.params.bookcaseId;
        var body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        bookcaseModel.findByIdAndUpdate(bookcaseId, body).exec((err, raw) => {
            if (err) {
                // TODO: handle 404 error
                res.status(400);
                res.json();
            } else {
                res.status(204);
                res.json();
            }
        });
    })
    .patch(function(req, res) {
        // TODO: handle removed fields
        var bookcaseId = req.params.bookcaseId;
        var body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        bookcaseModel.findByIdAndUpdate(bookcaseId, body).exec((err, raw) => {
            if (err) {
                // TODO: handle 404 error
                res.status(400);
                res.json();
            } else {
                res.status(204);
                res.json();
            }
        });
    })
    .delete(function(req, res) {
        // TODO: no RESTful
        var bookcaseId = req.params.bookcaseId;
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        async.waterfall([
                (callback) => {
                    userModel.update({}, { '$pull': { bookcases: bookcaseId } }, { multi: true }).exec((err, raw) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                },
                (callback) => {
                    bookcaseModel.findByIdAndRemove(bookcaseId).exec((err) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, null);
                        }
                    });
                }
            ],
            (err, result) => {
                if (err) {
                    res.status(404);
                    res.json();
                } else {
                    res.status(204);
                    res.json();
                }
            });
    });

module.exports = router;