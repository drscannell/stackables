/* --- app setup --- */

var express = require('express');
var app = express();
app.listen(process.env.PORT || 8000);

/* --- data endpoints --- */

app.get('/notes', function(req, res) {
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
