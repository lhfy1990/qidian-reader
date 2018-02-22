var express = require('express');
var https = require('https');
var cheerio = require('cheerio');
var async = require('async');
var mongoose = require('mongoose');
var userModel = mongoose.model('User');

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
        userModel.find(options).exec((err, user) => {
            if (err) {
                res.status(400);
                res.json();
            } else {
                res.status(200);
                res.json(user);
            }
        });
        // if (query.isInvalid) 400 BAD REQUEST
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        // 200 OK, no matter result is empty or not
    })
    .post((req, res) => {
        // TODO: this is customized for signup, no RESTFUL
        var body = req.body;
        userModel.create(body, (err, user) => {
            if (err) {
                // TODO: handle 400, 407 error
                res.status(400);
                res.json();
            } else {
                var res_user = JSON.parse(JSON.stringify(user));
                delete res_user.password;
                res.status(201);
                res.json(res_user);
            }
        });
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
router.route('/:userId')
    .get((req, res) => {
        var userId = req.params.userId;
        userModel.findById(userId).populate({path: 'bookcases', populate: {path: 'books'}}).exec((err, user) => {
            if (err) {
                res.status(400);
                res.json();
            } else {
                res.status(200);
                res.json(user);
            }
        });
    })
    .post(function(req, res) {
        // TODO: this is customized for login, no RESTFUL
        var username = req.params.userId;
        var body = req.body;
        if (typeof body.password === 'undefined') {
            res.status(401);
            res.json();
        } else {
            userModel.findOne({ username: username }).populate({path: 'bookcases', populate: {path: 'books'}}).exec((err, user) => {
                if (err) {
                    res.status(400);
                    res.json();
                } else {
                    if (!user || user.password !== body.password) {
                        res.status(403);
                        res.json();
                    } else {
                        var res_user = JSON.parse(JSON.stringify(user));
                        delete res_user.password;
                        res.status(200);
                        res.json(res_user);
                    }
                }
            });

        }
    })
    .put(function(req, res) {
        // TODO: handle removed fields
        var userId = req.params.userId;
        var body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        userModel.findByIdAndUpdate(userId, body).exec((err, raw) => {
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
        var userId = req.params.userId;
        var body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        userModel.findByIdAndUpdate(userId, body).exec((err, raw) => {
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
        var userId = req.params.userId;
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        userModel.findByIdAndRemove(userId).exec((err) => {
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