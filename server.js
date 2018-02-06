// requires
let path = require('path');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let https = require('https');
let cheerio = require('cheerio');
let async = require('async');

// TODO temp configs
let _csrfToken = 'XZqw9QcOhH0soDEUi7VLy968QXwvgAgTiFlxaduj';
let ywkey = 'ywq5K5S7iNNh';
let ywguid = '800194644077';
let cookie = `_csrfToken=${_csrfToken};ywkey=${ywkey};ywguid=${ywguid}`;
let cnt = 0;
// configs
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
let port = process.env.PORT || 8080;

// route
// static
app.use('', express.static(path.join(__dirname, 'public')));
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
// Book
router.route('/books')
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
router.route('/books/:bookId')
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
              if ($('.book-info')) {
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
router.route('/books/:bookId/:chapterId')
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
    let req_chapter = https.request(options, (res_chapter) => {
      if (res_chapter.statusCode !== 200) {
        res.status(404);
        res.json();
      } else {
        let html = '';
        res_chapter.on('data', (data) => {
          html += data;
        });
        res_chapter.on('end', () => {
          let $ = cheerio.load(html);
          let chapter_header = $(`#chapter-${chapter._id}`);
          let chapter_content = $('.read-content');
          if (!chapter_header || !chapter_content) {
            res.status(404);
            res.json();
          } else {
            if (chapter_header) {
              let data_info = $(chapter_header).attr('data-info');
              let parse_data_info = /\d+\|(-?\d+)\|(-?\d+)\|\d+\|\d+/.exec(data_info);
              if (parse_data_info) {
                chapter.prevId = parseInt(parse_data_info[1]);
                chapter.nextId = parseInt(parse_data_info[2]);
              }
            }
            if (chapter_content) {
              chapter.content = chapter_content.find('p').map((i, el)=>{return $(el).text();}).get();
            }
            res.status(200);
            res.json(chapter);
          }
        });
      }
    });
    req_chapter.on('error', (err) => {
      res.status(404);
      res.json();
    });
    req_chapter.end();
  });
app.use('/api', router);

// execute
app.listen(port);
console.log("Server running on port: " + port);