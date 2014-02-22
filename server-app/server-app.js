/*
 * Express App Setup
 *
 * Launch the app & establish middleware
 */
var express = require('express');
var fs = require('fs');
var app = express();
app.listen(process.env.PORT || 8000);
app.use(express.bodyParser());
app.use(express.cookieParser('321!!'));
app.use(function(req,res,next){
	console.log('\n' + req.method + ' ' + req.url);
	console.log('  username: ' + stackables.getUserIdFromCookie(req) );
	next();
});

/*
 * authentication
 */
var credentials = [
	{'username':'admin', 
		'password':'b921a42c761dbfff191c1aebe556d6f7', /* digdug */
		'email':''},
	{'username':'ccaruccio', 
		'password':'fea0f1f6fede90bd0a925b4194deac11', /* cheese */
		'email':'christina.caruccio@gmail.com'},
	{'username':'dscannell', 
		'password':'b921a42c761dbfff191c1aebe556d6f7', 
		'email':'danscannell@gmail.com'},
];
var PASSWORD_MAXAGE = 864000000; // ten days
var COOKIE_NAME = 'clutter.loggedin';

app.use(function(req,res,next){
	if ( stackables.isLoggedInAsAdmin(req) ) {
		next();
	} else if ( stackables.isLoggedInAsUser(req) ) {
		next();
	} else if ( req.url == '/login' ) {
		next();
	} else {
		console.log('  not logged in. Sending login page.');
		res.sendfile('client-app/login.html');
	}
});


/*
 * Mongo URI
 * 
 * Get URI from environment variables or fail
 */
var mongoURI = process.env.MONGO_LAB_URI || process.env.MONGOLAB_URI || process.env.LOCAL_MONGO_URI  || null;
if (mongoURI == null) throw new Error('Mongo URI environment variable not set up');

/*
 * Mongo Connect
 */
var mongoose = require('mongoose');
mongoose.connect(mongoURI);
var db = mongoose.connection;
var isConnected = false;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('Successfully connected to mongo');
	isConnected = true;
});

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
var noteSchema = mongoose.Schema({
		'name': String,
		'markdown': String,
		'createdby': mongoose.Schema.Types.ObjectId,
		'deleted': Boolean
	}, {'collection':'notes'});

var Note = mongoose.model('Note', noteSchema);

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

var User = mongoose.model('User', userSchema);

var stackSchema = mongoose.Schema({
	'name':String,
	'notes':Array
}, {'collection':'stacks'});
var Stack = mongoose.model('Stack', stackSchema);

/* --- login endpoints --- */

/*
 * POST '/login'
 *
 * A very simple credentials resolver
 * The benefit of keeping the credentials hardcoded for now
 * is that users can log in and use the basic functionality 
 * without needing to establish a database connection.
 * Scaleable? No, of course not.
 * 
 */
app.post('/login', function(req, res){
	console.log('login attempt');
	console.log('  name: ' + req.body.name);
	console.log('  pass: ' + req.body.password);
	var query = {'username':req.body.name};
	stackables.getUser(query, function(err, user) {
		if (!err) {
			if ( !('password' in user) ) {
				res.status(500).send({'error':'database error. no password on file'});
			} else if ( user.password == req.body.password ) {
				console.log('  logged in as ' + req.body.name + '(' + user._id + ')');
				res.cookie(COOKIE_NAME, user._id, { signed:true, maxAge:PASSWORD_MAXAGE });
				res.send({'success':'credentials accepted'});
			} else {
				res.status(401).send({'error':'wrong password'});
			}
		} else {
			res.status(401).send({'error':'nonexistent username'});
		}
	});
});
/*
 * GET '/logout'
 * 
 */
app.post('/logout', function(req, res){
	console.log('logout');
	res.clearCookie(COOKIE_NAME);
	res.send('logged out');	
});
/* --- data endpoints --- */

app.get('/notes', function(req, res) {
	var stackId = ('stackId' in req.query) ? req.query.stackId : null;
	if(stackId && stackId != 'all' && stackId != 'archived') {
		stackables.getNotesByStackId(req.query.stackId, function(err, data) {
			if (!err) {
				res.status(200).send(data);
			} else {
				res.status(501).send(err);
			}
		});
	} else if (stackId && stackId == 'archived') {
		console.log('  requested archived notes');
		getAllArchivedNotes(req, res, 1);
	} else {
		console.log('  No stack id specified.');
		getAllNotes(req, res, 1);
	}
});

app.get('/note', function(req, res) {
	stackables.getNote(req, res, 1);
});

app.post('/note', function(req, res){
	if ( '_id' in req.body ) {
		updateNote(req, res);
	} else {
		addNote(req, res);
	}
});

app.get('/stacks', function(req, res) {
	var userId = stackables.getUserIdFromCookie(req);
	stackables.getAllStacks(userId, function(err, data) {
		if (!err) {
			res.status(200).send(data);
		} else {
			res.status(501).send(err);
		}
	});
});

app.post('/stack', function(req, res){
	if ( '_id' in req.body ) {
		stackables.updateStack(req.body, function(err, stack) {
			if (!err) {
				console.log('  Successfully updated stack');
				res.status(200).send(stack);
			} else {
				console.log('  Failed to update stack');
				res.status(501).send(err);
			}
		});
	} else {
		stackables.addStack(req.body, function(err, stack) {
			if (!err) {
				console.log('  Successfully added stack');
				res.status(200).send(stack);
			} else {
				console.log('  Failed to add stack');
				res.status(501).send(err);
			}
		});
	}
});

app.get('/user', function(req, res) {
	var id = stackables.getUserIdFromCookie(req);
	stackables.getUserById(id, function(err, data) {
		if (!err) {
			res.status(200).send(data);
		} else {
			res.status(501).send(err);
		}
	});
});

app.post('/user', function(req, res){
	var newData = req.body;
	if ( '_id' in newData ) {
		stackables.updateUser(newData, function(err, data) {
			if (!err) {
				res.status(200).send();
			} else {
				res.status(501).send(err);
			}
		});
	} else {
		console.log('no _id for user!');
		res.status(400).send({'error':'No _id property found in request body'});
	} 
});



/* --- file endpoints --- */

app.get('/', function(req, res) {
	res.sendfile('client-app/index.html');
});
app.use(express.directory('client-app'));
app.use(express.static('client-app'));



/* --- app-specific functions --- */



var stackables = {};

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
		return null;
	}
};

// @function updateUser
stackables.updateUser = function(newData, callback) {
	var id = newData._id;
	delete newData._id;
	User.findByIdAndUpdate(id, newData, function(err, data) {
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
	console.log('  name: ' + newData.name);
	var newStack = new Stack(newData);
	newStack.save(function(err, stack) {
		if (!err) {
			console.log('  successfully added stack');
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
	Stack.findByIdAndUpdate(id, newData, function(err, data) {
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
	Stack.find({'_id': {$in:idArray}}, function(err, stacks) {
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
	Stack.findById(id, function(err, data) {
		if (!err) {
			callback(null, data);
		} else {
			console.log(err);
			callback({'error':'Unable to find stack in database'}, null);
		}
	});
};

// Add a single note
var addNote = function(req, res) {
	req.body.createdby = stackables.getUserObjectIdFromCookie(req);
	console.log('  name: ' + req.body.name);
	console.log('  createdby: ' + req.body.createdby);
	var newNote = new Note(req.body);
	newNote.save(function(err, note) {
		if (!err) {
			console.log('  successfully added note');
			res.status(200).send(note);
		} else {
			console.log(err);
			res.status(501).send({'error':err});
		}
	});
};

// Update a single note
var updateNote = function(req, res) {
	var noteId = req.body._id;
	delete req.body._id;
	// if empty, fill out createdby
	if( !('createdby' in req.body) ) {
		req.body.createdby = stackables.getUserObjectIdFromCookie(req);
	}
	console.log('  name: ' + req.body.name);
	console.log('  createdby: ' + req.body.createdby);
	console.log('  deleted: ' + req.body.deleted);
	Note.findByIdAndUpdate(noteId, req.body, function(err, doc) {
		if (!err) {
			console.log('  successfully updated');
			res.status(200).send(doc);
		} else {
			console.log(err);
			res.status(501).send({'error':err});
		}
	});
};

// Fetch all non-deleted notes
// Recurse up to 5 times if db connection is not open.
var getAllNotes = function(req, res, attempts) {
	var userObjectId = stackables.getUserObjectIdFromCookie(req);
	var query = {'deleted':false, 'createdby':userObjectId};
	console.log('  get all notes created by ' + query.createdby);
	Note.find( query,undefined,{sort:{'_id':1}}, function(err, notes) {
		if(!err) {
			console.log('  Retrieved ' + notes.length + ' notes from mongo');
			res.send(notes);
		} else {
			res.status(501);
			res.send({'error':'Failed to retrieve data from database.'});
		}
	});
};

// get all archived notes
var getAllArchivedNotes = function(req, res, attempts) {
	var userObjectId = stackables.getUserObjectIdFromCookie(req);
	var query = {'deleted':true, 'createdby':userObjectId};
	console.log('  get all notes created by ' + query.createdby);
	Note.find( query,undefined,{sort:{'_id':1}}, function(err, notes) {
		if(!err) {
			console.log('  Retrieved ' + notes.length + ' archived notes from mongo');
			res.send(notes);
		} else {
			res.status(501);
			res.send({'error':'Failed to retrieve data from database.'});
		}
	});
};

// get notes by stack id
stackables.getNotesByStackId = function(stackId, callback) {
	console.log('  Fetch notes in stack ' + stackId);
	stackables.getStackById(stackId, function(err, stack) {
		if (!err) {
			console.log('  Retrieved stack');
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
	Note.find({'_id': {$in:idArray}},undefined,{sort:{'_id':1}}, function(err, notes) {
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
	console.log('  get note where _id = ' + id);
	Note.findById( id, function(err, note) {
		if(!err) {
			console.log('  Retrieved successfully!');
			res.send(note);
		} else {
			res.status(501);
			res.send({'error':'Failed to retrieve data from database.'});
		}
	});
}

//Get user from database by id
stackables.getUserById = function(id, callback) {
	User.findById( id, {'username':true, 'email':true, 'colorScheme':true, 'stacks':true}, function(err, user) {
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
	User.findOne( query, function(err, user) {
		if(!err && user != null) {
			callback(null, user);
		} else {
			callback('Failed to retrieve user from database.', null);
		}
	});
};


