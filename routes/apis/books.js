let express = require('express');
let https = require('https');
let cheerio = require('cheerio');
let async = require('async');
let mongoose = require('mongoose');
let bookModel = mongoose.model('Book');
let bookcaseModel = mongoose.model('Bookcase');

let router = express.Router();
router.route('/')
    .get((req, res) => {
        // query: /api/objects/?property=textValue&propertyarray=textValue0&propertyarray=textValue1
        // TODO: elastic data type support
        let query = req.query;
        let options = { '$and': [] };
        Object.keys(query).forEach((elk, ik, ak) => {
            switch (elk) {
                case 'bId':
                    if (Array.isArray(query[elk])) {
                        options['$and'].push({ 'bId': { '$in': query[elk].map((elm, i, a) => parseInt(elm)) } });
                    } else {
                        options['$and'].push({ 'bId': parseInt(query[elk]) });
                    }
                    break;
                case 'name':
                    if (Array.isArray(query[elk])) {
                        options['$and'].push({ '$or': query[elk].map((elm, i, a) => { return { 'name': { '$regex': elm } }; }) });
                    } else {
                        options['$and'].push({ 'name': { '$regex': query[elk] } });
                    }
                    break;
                case 'author':
                    if (Array.isArray(query[elk])) {
                        options['$and'].push({ '$or': query[elk].map((elm, i, a) => { return { 'author': { '$regex': elm } }; }) });
                    } else {
                        options['$and'].push({ 'author': { '$regex': query[elk] } });
                    }
                    break;
                default:
                    break;
            }
            if (options['$and'].length === 0) {
                options = {};
            }
        });
        bookModel.find(options).exec((err, books) => {
            if (err) {
                res.status(400);
                res.json();
            } else {
                res.status(200);
                res.json(books);
            }
        });
        // if (query.isInvalid) 400 BAD REQUEST
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        // 200 OK, no matter result is empty or not
    })
    .post((req, res) => {
        let body = req.body;
        if (typeof body.bookcaseId === 'undefined') {
            res.status(400);
            res.json();
        } else {
            async.waterfall([
                (callback) => {
                    bookModel.create(body.book ? body.book : {}, (err, book) => {
                        if (err) {
                            // TODO: handle 400, 407 error
                            callback(err, null);
                        } else {
                            callback(null, book);
                        }
                    });
                },
                (book, callback) => {
                    bookcaseModel.findByIdAndUpdate(body.bookcaseId, { '$push': { books: book._id } }).exec((err, raw) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, book);
                        }
                    });
                }
            ], (err, book) => {
                if (err) {
                    // TODO: handle 400, 407 error
                    res.status(400);
                    res.json();
                } else {
                    res.status(201);
                    res.json(book);
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
router.route('/:bookId')
    .get((req, res) => {
        let cookie = req.headers.cookie;
        let _csrfToken = req.cookies._csrfToken;
        let bookId = parseInt(req.params.bookId);
        if (isNaN(bookId)) {
            res.status(400);
            res.json();
        } else {
            async.parallel({
                book: (callback) => {
                    let options = {
                        host: 'book.qidian.com',
                        path: `/ajax/book/category?_csrfToken=${_csrfToken}&bookId=${bookId}`,
                        method: 'GET',
                        headers: {
                            'Cookie': cookie
                        }
                    };
                    let req = https.request(options, (res) => {
                        if (res.statusCode !== 200) {
                            callback({ statusCode: res.statusCode }, null);
                        } else {
                            let str_json = '';
                            res.on('data', (data) => {
                                str_json += data;
                            });
                            res.on('end', () => {
                                try {
                                    let obj_json = JSON.parse(str_json);
                                    if (obj_json.code === 0) {
                                        callback(null, obj_json.data);
                                    } else {
                                        callback({ statusCode: 404 }, null);
                                    }
                                } catch (e) {
                                    callback({ statusCode: 404 }, null);
                                }
                            });
                        }
                    });
                    req.on('error', (err) => {
                        callback({ statusCode: 404 }, null);
                    });
                    req.end();
                },
                bN: (callback) => {
                    let options = {
                        host: 'book.qidian.com',
                        path: `/info/${bookId}`,
                        method: 'GET',
                        headers: {
                            'Cookie': cookie
                        }
                    };
                    let req = https.request(options, (res) => {
                        if (res.statusCode !== 200) {
                            callback({ statusCode: res.statusCode }, null);
                        } else {
                            let html = '';
                            res.on('data', (data) => {
                                html += data;
                            });
                            res.on('end', () => {
                                let $ = cheerio.load(html);
                                let book_info = $('.book-info');
                                if (book_info.length !== 0) {
                                    callback(null, $(book_info).find('h1>em').text());
                                } else {
                                    callback({ statusCode: 404 }, null);
                                }
                            });
                        }
                    });
                    req.on('error', (err) => {
                        callback({ statusCode: 404 }, null);
                    });
                    req.end();
                }
            }, (err, result) => {
                if (err) {
                    res.status(err.statusCode);
                    res.json();
                } else {
                    res.status(200);
                    let result_book = result.book;
                    result_book._id = bookId;
                    result_book.bN = result.bN;
                    res.json(result_book);
                }
            });
        }
    })
    .post(function(req, res) {
        // not allowed
        let statusCode = 405; // 405 METHOD NOT ALLOWED
        res.status(statusCode);
        res.json();
    })
    .put(function(req, res) {
        // TODO: handle removed fields
        let bookId = req.params.bookId;
        let body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        bookModel.findByIdAndUpdate(bookId, body).exec((err, raw) => {
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
        let bookId = req.params.bookId;
        let body = req.body;
        // if (body.isInvalid) 400 BAD REQUEST
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        bookModel.findByIdAndUpdate(bookId, body).exec((err, raw) => {
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
        let bookId = req.params.bookId;
        // if (objectId.isNotFound) 404 NOT FOUND
        // if (isNoAuthIntormation) 401 UNAUTHORIZED
        // if (isNoRights) 403 FORBIDDEN
        async.waterfall([
                (callback) => {
                    bookcaseModel.update({}, { '$pull': { books: bookId } }, { multi: true }).exec((err, raw) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                },
                (callback) => {
                    bookModel.findByIdAndRemove(bookId).exec((err) => {
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
router.route('/:bookId/:chapterId')
    .get((req, res) => {
        let cookie = req.headers.cookie;
        let statusCode = null; // 200 OK
        let bookId = req.params.bookId;
        let chapterId = req.params.chapterId;
        let chapter = {
            _id: chapterId,
            book: bookId,
            prevId: -1,
            nextId: -1,
            content: []
        };
        let options = {
            host: 'vipreader.qidian.com',
            path: `/chapter/${chapter.book}/${chapter._id}`,
            method: 'GET',
            headers: {
                'Cookie': cookie
            }
        };
        let count = 0;
        let hasVIPLimit = true;
        async.until(
            () => { return count >= 9 || !hasVIPLimit; },
            (cb_until) => {
                count++;
                let req = https.request(options, (res) => {
                    if (res.statusCode !== 200) {
                        cb_until({ statusCode: res.statusCode }, null)
                    } else {
                        let html = '';
                        res.on('data', (data) => {
                            html += data;
                        });
                        res.on('end', () => {
                            let $ = cheerio.load(html);
                            let chapter_header = $(`#chapter-${chapter._id}`);
                            let chapter_content = $('.read-content');
                            let vip_limit_wrap = $('.vip-limit-wrap');
                            if (vip_limit_wrap.length === 0) {
                                hasVIPLimit = false;
                            }
                            if (chapter_header.length === 0 || chapter_content.length === 0) {
                                cb_until({ statusCode: 404 }, null);
                            } else {
                                if (chapter_header.length !== 0) {
                                    let data_info = $(chapter_header).attr('data-info');
                                    let parse_data_info = /\d+\|(-?\d+)\|(-?\d+)\|\d+\|\d+/.exec(data_info);
                                    if (parse_data_info) {
                                        chapter.prevId = parseInt(parse_data_info[1]);
                                        chapter.nextId = parseInt(parse_data_info[2]);
                                    }
                                }
                                if (chapter_content.length !== 0) {
                                    chapter.content = chapter_content.find('p').map((i, el) => { return $(el).text(); }).get();
                                }
                                chapter.hasVIPLimit = hasVIPLimit;
                                cb_until(null, chapter);
                            }
                        });
                    }
                });
                req.on('error', (err) => {
                    cb_until({ statusCode: 404 }, null);
                });
                req.end();
            },
            (err, result) => {
                if (err) {
                    res.status(err.statusCode);
                    res.json();
                } else {
                    res.status(200);
                    res.json(result);
                }
            });
    });

module.exports = router;