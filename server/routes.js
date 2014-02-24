var express = require('express');

module.exports = function(app, stackables) {

	app.use(express.bodyParser());
	app.use(express.cookieParser('321!!'));
	app.use(function(req,res,next){
		console.log('\n' + req.method + ' ' + req.url);
		next();
	});

	app.use(function(req,res,next){
		if ( stackables.isLoggedInAsAdmin(req) ) {
			next();
		} else if ( stackables.isLoggedInAsUser(req) ) {
			next();
		} else if ( req.url == '/login' ) {
			next();
		} else {
			res.sendfile('client/login.html');
		}
	});

	app.post('/login', function(req, res){
		stackables.login(req, res, function(err, res_status) {
			if (!err) {
				res.status(200).send({'success':'credentials accepted'});
			} else {
				res.status(res_status).send(err);
			}
		});
	});

	app.post('/logout', function(req, res){
		stackables.logout(req, res, function(err){
			if (!err) {
				res.status(200).send('logged out');	
			} else {
				res.status(500).send(err);
			}
		});
	});

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
			stackables.getAllArchivedNotes(req, res, 1);
		} else {
			stackables.getAllNotes(req, res, 1);
		}
	});

	app.get('/note', function(req, res) {
		stackables.getNote(req, res, 1);
	});

	app.post('/note', function(req, res){
		if ( '_id' in req.body ) {
			stackables.updateNote(req, res);
		} else {
			stackables.addNote(req, res);
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
		console.log('post /stack');
		console.log(req.body);
		if ( '_id' in req.body ) {
			stackables.updateStack(req.body, function(err, stack) {
				if (!err) {
					res.status(200).send(stack);
				} else {
					res.status(501).send(err);
				}
			});
		} else {
			stackables.addStack(req.body, function(err, stack) {
				if (!err) {
					res.status(200).send(stack);
				} else {
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

	app.get('/', function(req, res) {
		res.sendfile('client/index.html');
	});

	app.use(express.directory('client'));
	app.use(express.static('client'));
};
