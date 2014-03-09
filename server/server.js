
var fs = require('fs');
var app = require('express')();
var mongoose = require('mongoose');
var passport = require('passport');

// mongo connect
var configDB = require('./config/database.js');
if (configDB.url == null) 
	throw new Error('Mongo URI environment variable not set up');
mongoose.connect(configDB.url);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// only launch app if db connection successful
db.once('open', function(){

	console.log('Successfully connected to mongo');

	var models = require('./models.js')();

	var stackables = require('./stackables.js')(models);

	require('./routes.js')(app, stackables);

	var port = process.env.PORT || 8000;
	console.log('Server running at http://localhost:' + port);
	app.listen(port);

});












