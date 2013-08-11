/* --- app setup --- */

var express = require('express');
var app = express();
app.listen(process.env.PORT || 8000);
app.use(express.bodyParser());
app.use(function(req,res,next){
	console.log('\n' + req.method + ' ' + req.url);
	next();
});

/* --- mongolab --- */

var mongoURI = process.env.MONGO_LAB_URI || process.env.MONGOLAB_URI || null;
if (mongoURI == null) throw new Error('mongo uri env var not set up');

/* --- mongoose --- */

var mongoose = require('mongoose');
mongoose.connect(mongoURI);
var db = mongoose.connection;
var isConnected = false;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('Successfully connected to mongo');
	isConnected = true;
});

var noteSchema = mongoose.Schema({
	'name': String,
	'markdown': String,
	'deleted': Boolean
});
var Note = mongoose.model('Note', noteSchema);

/* --- data endpoints --- */

app.get('/notes', function(req, res) {
	
	getAllNotes(req, res, 1);
});

app.post('/note', function(req, res){
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
});

/*
 * This function will recurse up to five
 * times if the db connection is not open.
 */
function getAllNotes(req, res, attempts) {
	if (isConnected) {
		Note.find({'deleted':false}, function(err, notes) {
			if(!err) {
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
