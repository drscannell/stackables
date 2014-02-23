
var fs = require('fs');
var app = require('express')();
var mongoose = require('mongoose');

// mongo connect
var mongoURI = process.env.MONGO_LAB_URI || process.env.MONGOLAB_URI || process.env.LOCAL_MONGO_URI  || null;

if (mongoURI == null) 
	throw new Error('Mongo URI environment variable not set up');

mongoose.connect(mongoURI);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// only launch app if db connection successful
db.once('open', function(){

	console.log('Successfully connected to mongo');

	var models = require('./models.js')();

	var stackables = require('./stackables.js')(models);

	require('./routes.js')(app, stackables);

	app.listen(process.env.PORT || 8000);

});












