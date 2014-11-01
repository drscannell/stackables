
var fs = require('fs');
var app = require('express')();
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var express = require('express');

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
	require('./config/passport')(passport, models.User);

	app.configure(function() {
		app.use(express.logger('dev'));
		app.use(express.cookieParser());
		app.use(express.bodyParser());
		app.set('view engine', 'ejs');
		app.use(express.session({secret:'digdug'}));
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(flash());
	});



	var stackables = require('./stackables.js')(models);

	require('./routes.js')(app, stackables, passport);

	var port = process.env.PORT || 8080;
	console.log('Server running at http://localhost:' + port);
	app.listen(port);

});












