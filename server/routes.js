var express = require('express');

module.exports = function(app, stackables, passport) {


	app.get('/', function(req, res) {
		console.log('auth? ' + req.isAuthenticated());
		if (req.isAuthenticated()) {
			res.sendfile('client/index.html');
		} else {
			res.render('../client/login.ejs', {
				messages:req.flash('loginMessage')
			});
		}
	});

	app.get('/logout', function(req,res) {
		req.logout();
		res.redirect('/');
	});
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true
	}));
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true
	}));
	app.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true
	}));

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		res.redirect('/');
	};
	
	/*
	app.use(express.bodyParser());
	app.use(express.cookieParser('321!!'));
	app.use(function(req,res,next){
		console.log('\n' + req.method + ' ' + req.url);
		next();
	});

	function isLoggedIn(req, res, next) {
		if ( stackables.isLoggedInAsAdmin(req) ) {
			next();
		} else if ( stackables.isLoggedInAsUser(req) ) {
			next();
		} else {
			res.redirect('/');
		}
	}

	app.get('/', function(req, res) {
		if ( stackables.isLoggedInAsAdmin(req) ) {
			res.sendfile('client/index.html');
		} else if ( stackables.isLoggedInAsUser(req) ) {
			res.sendfile('client/index.html');
		} else {
			res.sendfile('client/login.html');
		}
	});
	*/

	app.get('/login.html', function(req, res) {
		res.redirect('/');
	});

	/*
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
	*/

	app.get('/notes', isLoggedIn, function(req, res) {
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

	app.get('/note', isLoggedIn, function(req, res) {
		stackables.getNote(req, res, 1);
	});

	app.post('/note', isLoggedIn, function(req, res){
		if ( '_id' in req.body ) {
			stackables.updateNote(req, res);
		} else {
			stackables.addNote(req, res);
		}
	});

	app.get('/stacks', isLoggedIn, function(req, res) {
		console.log('req.user');
		console.log(req.user);
		//var userId = stackables.getUserIdFromCookie(req);
		var userId = req.user._id;
		stackables.getAllStacks(userId, function(err, data) {
			if (!err) {
				res.status(200).send(data);
			} else {
				res.status(501).send(err);
			}
		});
	});

	app.post('/stack', isLoggedIn, function(req, res){
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

	app.get('/user', isLoggedIn, function(req, res) {
		res.status(200).send(req.user);
		/*
		var id = stackables.getUserIdFromCookie(req);
		stackables.getUserById(id, function(err, data) {
			if (!err) {
				res.status(200).send(data);
			} else {
				res.status(501).send(err);
			}
		});
		*/
	});

	app.post('/user', isLoggedIn, function(req, res){
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

	app.use(express.directory('client'));
	app.use(express.static('client'));
};
