let express = require('express');
let https = require('https');
let cheerio = require('cheerio');
let async = require('async');

// TODO temp configs
let _csrfToken = 'XZqw9QcOhH0soDEUi7VLy968QXwvgAgTiFlxaduj';
let ywkey = 'ywq5K5S7iNNh';
let ywguid = '800194644077';
let cookie = `_csrfToken=${_csrfToken};ywkey=${ywkey};ywguid=${ywguid}`;
let cnt = 0;

let router = express.Router();
router.route('/')
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
router.route('/:bookId')
    .get((req, res) => {
        let bookId = req.params.bookId;
        let book = {
            _id: bookId,
            readChapterId: 0,
            readProgress: ''
        };
        async.waterfall([
            (callback) => {
                // TODO some books do not return chapters, example book 1004588586
                let options = {
                    host: 'book.qidian.com',
                    path: `/info/${book._id}`,
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
                            if ($('.book-info').length !== 0) {
                                callback(null, $('.volume').find('.cf>li>a').map((i, el) => {
                                    let chapter = {
                                        href: $(el).attr('href'),
                                        title: $(el).text(),
                                    };
                                    chapter.href = $(el).attr('href');
                                    let parse_href = /.*chapter\/([0-9]*)\/([0-9]*)/.exec(chapter.href);
                                    let parse_title = /首发时间：(.*) 章节字数：(.*)/.exec($(el).attr('title'));
                                    if (parse_href) {
                                        chapter._id = parse_href[2];
                                    };
                                    if (parse_title) {
                                        chapter.utcTime = new Date(parse_title[1] + '+0800');
                                        chapter.charCount = parse_title[2]
                                    }
                                    return chapter;
                                }).get());
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
            },
            (chapters, callback) => {
                let options = {
                    host: 'book.qidian.com',
                    path: `/ajax/book/GetReadStatus?_csrfToken=${_csrfToken}&bookId=${book._id}`,
                    method: 'GET',
                    headers: {
                        'Cookie': cookie
                    }
                };
                let isSuccess = false;
                let count = 0;
                async.until(
                    () => { return isSuccess || count > 30; },
                    (cb_until) => {
                        let req = https.request(options, (res) => {
                            if (res.statusCode !== 200) {
                                cb_until({ statusCode: res.statusCode }, null);
                            } else {
                                let json = '';
                                res.on('data', (data) => {
                                    json += data;
                                });
                                res.on('end', () => {
                                    let data = JSON.parse(json).data;
                                    count++;
                                    if (typeof data.isInBookShelf !== 'undefined') {
                                        isSuccess = true;
                                    }
                                    cb_until(null, { readChapterId: data.readChapterId ? data.readChapterId : null, readProgress: data.readProgress ? data.readProgress : null });
                                });
                            }
                        });
                        req.on('error', (err) => {
                            cb_until({ statusCode: 404 }, null);
                        });
                        req.end();
                    },
                    (err, result) => {
                        callback(err, { chapters: chapters, read: result });
                    });
            }
        ], (err, result) => {
            if (err) {
                res.status(err.statusCode);
                res.json();
            } else if (!result) {
                res.status(404);
                res.json();
            } else {
                res.status(200);
                book.chapters = result.chapters;
                book.readChapterId = result.read.readChapterId ? result.read.readChapterId : null;
                book.readProgress = result.read.readProgress ? result.read.readProgress : null;
                res.json(book);
            }
        });
    });
router.route('/:bookId/:chapterId')
    .get((req, res) => {
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