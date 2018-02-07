let express = require('express');

// TODO temp configs
let _csrfToken = 'XZqw9QcOhH0soDEUi7VLy968QXwvgAgTiFlxaduj';
let ywkey = 'ywq5K5S7iNNh';
let ywguid = '800194644077';
let cookie = `_csrfToken=${_csrfToken};ywkey=${ywkey};ywguid=${ywguid}`;
let cnt = 0;

let router = express();
router.get('/',
  (req, res) => {
    res.json({
      message: "hello, Bookcases!"
    });
  });

module.exports = router;