var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

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
		'local': {
			'password': String,
			'email': String
		},
		'facebook': {
			'id': String,
			'token': String,
			'email': String,
			'name': String
		},
		'twitter': {
			'id': String,
			'token': String,
			'displayName': String,
			'username': String
		},
		'google': {
			'id': String,
			'token': String,
			'email': String,
			'name': String
		},
		'stacks': Array
	}, {'collection':'users'});
	
	userSchema.methods.generateHash = function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	};

	userSchema.methods.validPassword = function(password) {
		return bcrypt.compareSync(password, this.local.password);
	};

	models.User = mongoose.model('User', userSchema);

	var stackSchema = mongoose.Schema({
		'name':String,
		'notes':Array,
		'isDeleted':Boolean
	}, {'collection':'stacks'});
	models.Stack = mongoose.model('Stack', stackSchema);
	return models;
};
