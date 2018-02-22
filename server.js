// requires
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
var mongoose = require('mongoose');
var router_api;

// configs
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
var port = process.env.PORT || 8080;

// mongoose.set('debug', true);
// var mongodb = 'mongodb://localhost/qidian-reader';
var mongodb = 'mongodb://qruser:qruser@mongodb/qidian-reader';
mongoose.connect(mongodb, { autoIndex: false });
var db = mongoose.connection;
var bookModel = require('./models/book.js')(db);
var bookcaseModel = require('./models/bookcase.js')(db);
var userModel = require('./models/user.js')(db);

// execution
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    bookModel.ensureIndexes();
    bookcaseModel.ensureIndexes();
    userModel.ensureIndexes();
    console.log(`${mongodb} connect`);
    // route
    // static
    app.use('', express.static(path.join(__dirname, 'public')));
    // api
    router_api = require('./routes/api.js');
    app.use('/api', router_api);

    // execute
    app.listen(port);
    console.log(`Server running on port: ${port}`);
});