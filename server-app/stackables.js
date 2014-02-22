var mongoose = require('mongoose');

module.exports = function(models){

	var PASSWORD_MAXAGE = 864000000; // ten days
	var COOKIE_NAME = 'clutter.loggedin';

	stackables = {};

	// login
	stackables.login = function(req, res, callback) {
		console.log('login attempt');
		console.log('  name: ' + req.body.name);
		console.log('  pass: ' + req.body.password);
		var query = {'username':req.body.name};
		stackables.getUser(query, function(err, user) {
			console.log('receiving stackables.getUser response');
			if (!err) {
				if ( !('password' in user) ) {
					callback({'error':'database error. no password on file'}, 500);
				} else if ( user.password == req.body.password ) {
					console.log('logged in as ' + req.body.name + '(' + user._id + ')');
					try {
						res.cookie(COOKIE_NAME, user._id, {
							signed:true, 
							maxAge:PASSWORD_MAXAGE 
						});
						callback(null, 200);
					} catch(ex) {
						console.log(ex);
						callback({'error':ex}, 500);
					}
				} else {
					callback({'error':'wrong password'}, 401);
				}
			} else {
				callback({'error':'nonexistent username'}, 401);
			}
		});
	};

	stackables.logout = function(req, res, callback) {
		console.log('logout');
		try {
			res.clearCookie(COOKIE_NAME);
			callback(null);
		} catch (ex) {
			console.log(ex);
			callback({'error':ex});
		}
	};

	// @function isLoggedInAsAdmin
	stackables.isLoggedInAsAdmin = function(req) { 
		if (!req) throw Error('stackables.getUserIdFromCookie(req) requires non-null argument');
		return (req.signedCookies[COOKIE_NAME] == 'admin'); 
	};

	// @function isLoggedInAsUser
	stackables.isLoggedInAsUser = function(req) { 
		if (!req) throw Error('stackables.getUserIdFromCookie(req) requires non-null argument');
		return (req.signedCookies[COOKIE_NAME]); 
	};

	// @function getUserIdFromCookie
	stackables.getUserIdFromCookie = function(req) { 
		if (!req) throw Error('stackables.getUserIdFromCookie(req) requires non-null argument');
		try {
			return req.signedCookies[COOKIE_NAME]; 
		} catch(ex) {
			return null;
		}
	};

	// Get user id from cookie and wrap in ObjectId object.
	// @function getUserObjectIdFromCookie
	stackables.getUserObjectIdFromCookie = function(req) {
		try {
			var id = stackables.getUserIdFromCookie(req);
			return new mongoose.Types.ObjectId(id );
		} catch(ex) {
			console.log(ex);
			return null;
		}
	};

	// @function updateUser
	stackables.updateUser = function(newData, callback) {
		var id = newData._id;
		delete newData._id;
		models.User.findByIdAndUpdate(id, newData, function(err, data) {
			if (!err) {
				callback(null, data);
			} else {
				console.log(err);
				callback({'error':'Unable to update user'}, null);
			}
		});
	};

	// Add a single stack
	stackables.addStack = function(newData, callback) {
		console.log('addStack');
		console.log('name: ' + newData.name);
		var newStack = new Stack(newData);
		newStack.save(function(err, stack) {
			if (!err) {
				console.log('successfully added stack');
				callback(null, stack);
			} else {
				console.log(err);
				callback({'error':'Failed to add new stack'}, null);
			}
		});
	};

	// Update a single stack
	stackables.updateStack = function(newData, callback) {
		var id = newData._id;
		delete newData._id;
		models.Stack.findByIdAndUpdate(id, newData, function(err, data) {
			if (!err) {
				callback(null, data);
			} else {
				console.log(err);
				callback({'error':'Unable to update stack'}, null);
			}
		});
	};

	// @function getAllStacks
	stackables.getAllStacks = function(userId, callback) {
		stackables.getUserById(userId, function(err, user) {
			if (!err) {
				// extract id array from user object
				var idArray = [];
				for (var i = 0; i < user.stacks.length; i++ ) {
					idArray.push(user.stacks[i].stackId);
				}
				stackables.getStacksByIdArray(idArray, function(err, stacks) {
					if (!err && stacks != null) {
						callback(null, stacks);
					} else {
						callback({'error':'Unable to fetch stacks'}, null);
					}
				});		
			} else {
				callback({'error':'Unable to get user from database.'}, null);
			}
		});
	};

	// @function getStacksByIdArray
	stackables.getStacksByIdArray = function(idArray, callback) {
		models.Stack.find({'_id': {$in:idArray}}, function(err, stacks) {
			if (!err) {
				callback(null, stacks);
			} else {
				console.log(err);
				callback({'error':'Unable to find stacks in database'}, null);
			}
		});
	};

	// @function getStackById
	stackables.getStackById = function(id, callback) {
		models.Stack.findById(id, function(err, data) {
			if (!err) {
				callback(null, data);
			} else {
				console.log(err);
				callback({'error':'Unable to find stack in database'}, null);
			}
		});
	};

	// Add a single note
	stackables.addNote = function(req, res) {
		req.body.createdby = stackables.getUserObjectIdFromCookie(req);
		console.log('name: ' + req.body.name);
		console.log('createdby: ' + req.body.createdby);
		var newNote = new Note(req.body);
		newNote.save(function(err, note) {
			if (!err) {
				console.log('successfully added note');
				res.status(200).send(note);
			} else {
				console.log(err);
				res.status(501).send({'error':err});
			}
		});
	};

	// Update a single note
	stackables.updateNote = function(req, res) {
		var noteId = req.body._id;
		delete req.body._id;
		// if empty, fill out createdby
		if( !('createdby' in req.body) ) {
			req.body.createdby = stackables.getUserObjectIdFromCookie(req);
		}
		console.log('name: ' + req.body.name);
		console.log('createdby: ' + req.body.createdby);
		console.log('deleted: ' + req.body.deleted);
		models.Note.findByIdAndUpdate(noteId, req.body, function(err, doc) {
			if (!err) {
				console.log('successfully updated');
				res.status(200).send(doc);
			} else {
				console.log(err);
				res.status(501).send({'error':err});
			}
		});
	};

	// Fetch all non-deleted notes
	// Recurse up to 5 times if db connection is not open.
	stackables.getAllNotes = function(req, res, attempts) {
		var userObjectId = stackables.getUserObjectIdFromCookie(req);
		var query = {'deleted':false, 'createdby':userObjectId};
		console.log('get all notes created by ' + query.createdby);
		models.Note.find( query,undefined,{sort:{'_id':1}}, function(err, notes) {
			if(!err) {
				console.log('Retrieved ' + notes.length + ' notes from mongo');
				res.send(notes);
			} else {
				res.status(501);
				res.send({'error':'Failed to retrieve data from database.'});
			}
		});
	};

	// get all archived notes
	stackables.getAllArchivedNotes = function(req, res, attempts) {
		var userObjectId = stackables.getUserObjectIdFromCookie(req);
		var query = {'deleted':true, 'createdby':userObjectId};
		console.log('get all notes created by ' + query.createdby);
		models.Note.find( query,undefined,{sort:{'_id':1}}, function(err, notes) {
			if(!err) {
				console.log('Retrieved ' + notes.length + ' archived notes from mongo');
				res.send(notes);
			} else {
				res.status(501);
				res.send({'error':'Failed to retrieve data from database.'});
			}
		});
	};

	// get notes by stack id
	stackables.getNotesByStackId = function(stackId, callback) {
		console.log('Fetch notes in stack ' + stackId);
		stackables.getStackById(stackId, function(err, stack) {
			if (!err) {
				console.log('Retrieved stack');
				console.log(stack.notes);
				stackables.getNotesByIdArray(stack.notes, function(err, notes) {
					if (!err) {
						var unarchivedNotes = [];
						for (var i = 0; i < notes.length; i++) {
							if(!notes[i].deleted) {
								unarchivedNotes.push(notes[i]);
							}
						}
						callback(null, unarchivedNotes);
					} else {
						callback(err, null);
					}
				});
			} else {
				callback(err, null);
			}
		});
	};

	// get notes by id array
	stackables.getNotesByIdArray = function(idArray, callback) {
		models.Note.find({'_id': {$in:idArray}},undefined,{sort:{'_id':1}}, function(err, notes) {
			if (!err) {
				callback(null, notes);
			} else {
				console.log(err);
				callback({'error':'Unable to find notes in database'}, null);
			}
		});
	};

	// Get note from database
	stackables.getNote = function(req, res, attempts) {
		var id = req.query.id;
		console.log('get note where _id = ' + id);
		models.Note.findById( id, function(err, note) {
			if(!err) {
				console.log('Retrieved successfully!');
				res.send(note);
			} else {
				res.status(501);
				res.send({'error':'Failed to retrieve data from database.'});
			}
		});
	}

	//Get user from database by id
	stackables.getUserById = function(id, callback) {
		models.User.findById( id, {'username':true, 'email':true, 'colorScheme':true, 'stacks':true}, function(err, user) {
			if(!err && user != null) {
				callback(null,user);
			} else {
				callback({'error':'Failed to retrieve data from database'}, null);
			}
		});
	};

	//Get user from database with general query
	stackables.getUser = function(query, callback) {
		console.log('getUser');
		models.User.findOne( query, function(err, user) {
			console.log('models.User.findOne response');
			if(!err && user != null) {
				callback(null, user);
			} else {
				callback('Failed to retrieve user from database.', null);
			}
		});
	};

	return stackables;
};


