let express = require('express');
let https = require('https');
let cheerio = require('cheerio');
let async = require('async');
let mongoose = require('mongoose');
let userModel = mongoose.model('User');
let bookcaseModel = mongoose.model('Bookcase');

let router = express.Router();
router.route('/')
    .get((req, res) => {
        // query: /api/objects/?property=textValue&propertyarray=textValue0&propertyarray=textValue1
        let query = req.query;
        let options = {};
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
        let body = req.body;
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
        let statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .patch(function(req, res) {
        // not allowed, unless you want to update/modify every resource in the entire collection
        let statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .delete(function(req, res) {
        // not allowed, unless you want to delete the whole collection—not often desirable
        let statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    });
router.route('/:bookcaseId')
    .get((req, res) => {
        let bookcaseId = req.params.bookcaseId;
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
        let statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .put(function(req, res) {
        // TODO: handle removed fields
        let bookcaseId = req.params.bookcaseId;
        let body = req.body;
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
        let bookcaseId = req.params.bookcaseId;
        let body = req.body;
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
        let bookcaseId = req.params.bookcaseId;
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