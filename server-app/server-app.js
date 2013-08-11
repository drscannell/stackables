/*
 * Express App Setup
 *
 * Launch the app & establish middleware
 */
var express = require('express');
var app = express();
app.listen(process.env.PORT || 8000);
app.use(express.bodyParser());
app.use(function(req,res,next){
	console.log('\n' + req.method + ' ' + req.url);
	next();
});

/*
 * Mongo URI
 * 
 * Get URI from environment variables or fail
 */
var mongoURI = process.env.MONGOLAB_URI || process.env.LOCAL_MONGO_URI  || null;
if (mongoURI == null) throw new Error('Mongo URI environment variable not set up');

/*
 * Mongo Connect
 * 
 * The moment of truth. Many tears have been
 * shed trying to get that elusive connection.
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
	'deleted': Boolean
});
var Note = mongoose.model('Note', noteSchema);

/*
 * Update a single note
 */
function updateNote(req, res) {
	console.log('app.post');
	console.log(req.body);
	var noteId = req.body._id;
	delete req.body._id;
	Note.findByIdAndUpdate(noteId, req.body, function(err, doc) {
		if (!err) {
			console.log('successfully updated');
			res.send(200);
		} else {
			console.log(err);
			res.send(500);
		}
	});
}

/*
 * Add a single note
 */
function addNote(req, res) {
	console.log('addNote');
	console.log(req.body);
	var newNote = new Note(req.body);
	newNote.save(function(err, note) {
		if (!err) {
			console.log('successfully updated');
			console.log(note);
			res.status(200);
			res.send(note);
		} else {
			console.log(err);
			res.send(500);
		}
	});
}
/*
 * Fetch all non-deleted notes
 * 
 * This function will recurse up to five
 * times if the db connection is not open.
 */
function getAllNotes(req, res, attempts) {
	if (isConnected) {
		Note.find({'deleted':false}, function(err, notes) {
			if(!err) {
				console.log('Retrieved ' + notes.length + ' notes from mongo');
				console.log(notes);
				res.send(notes);
			} else {
				res.status(501);
				res.send({'error':'Failed to retrieve data from database.'});
			}
		});
	} else if (attempts <= 5) {
		console.log('Attempt ' + attempts + ' to retrieve notes failed.');
		attempts++;
		setTimeout(function(){getAllNotes(req, res, attempts);},500);
	} else {
		console.log('Too many failed attempts to retrieve notes. Sending error.');
		res.status(500);
		res.send({'error':'Failed to connect to database.'});
	}
}
/* --- data endpoints --- */

app.get('/notes', function(req, res) {
	getAllNotes(req, res, 1);
});

app.post('/note', function(req, res){
	if ( '_id' in req.body ) {
		updateNote(req, res);
	} else {
		addNote(req, res);
	}
});


app.get('/testnotes', function(req, res) {
	var testData = [
		{'name':'Note 1', 'markdown':'Text of note 1'},
		{'name':'Note 2', 'markdown':'Text of note 2'},
		{'name':'Note 3', 'markdown':'Text of note 3'},
		{'name':'Note 4', 'markdown':'Text of note 4'},
		{'name':'Note 5', 'markdown':'Text of note 5'}
	];
	res.send(testData);
});

/* --- file endpoints --- */

app.get('/', function(req, res) {
	res.sendfile('client-app/index.html');
});
app.use(express.directory('client-app'));
app.use(express.static('client-app'));
