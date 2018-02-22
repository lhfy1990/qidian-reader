// requires
let path = require('path');
let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let app = express();
let mongoose = require('mongoose');
let router_api;

// configs
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
let port = process.env.PORT || 8080;

// mongoose.set('debug', true);
// let mongodb = 'mongodb://localhost/qidian-reader';
let mongodb = 'mongodb://qruser:qruser@mongodb/qidian-reader';
mongoose.connect(mongodb, { autoIndex: false });
let db = mongoose.connection;
let bookModel = require('./models/book.js')(db);
let bookcaseModel = require('./models/bookcase.js')(db);
let userModel = require('./models/user.js')(db);

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