var mongoose = require('mongoose');

/*
 * Mongoose Models
 *
 * Models form the basis for all
 * database interactions in the
 * mongoose library.
 *
 * If the database doesn't seem to be
 * updating properly, double check the
 * properties in the schema for the
 * troublesome model.
 */
module.exports = function() {
	var models = {};
	var noteSchema = mongoose.Schema({
			'name': String,
			'markdown': String,
			'createdby': mongoose.Schema.Types.ObjectId,
			'deleted': Boolean
		}, {'collection':'notes'});

	models.Note = mongoose.model('Note', noteSchema);

	var userSchema = mongoose.Schema({
		'username': String,
		'password': String,
		'email': String,
		'colorScheme':{
			'appColor': String,
			'noteColor': String,
			'buttonColor': String
		},
		'stacks': Array
	}, {'collection':'users'});

	models.User = mongoose.model('User', userSchema);

	var stackSchema = mongoose.Schema({
		'name':String,
		'notes':Array
	}, {'collection':'stacks'});
	models.Stack = mongoose.model('Stack', stackSchema);
	return models;
};
