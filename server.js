// requires
let path = require('path');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let router_api = require('./routes/api.js');

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
app.use('/api', router_api);

// execute
app.listen(port);
console.log("Server running on port: " + port);