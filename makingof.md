# Making of Private Note Webapp

Assumptions:

* You have already registered at Heroku.com
* You have already installed the Heroku toolbelt: https://toolbelt.heroku.com/

1. Go to Heroku.com and create a new app
2. Clone the empty repository to your local harddrive using the heroku option

		git clone <url to repository> -o heroku

3. Create two folders in your repository root: client-app/ and server-app/

	These are not technically necessary, but I find it useful to
	to keep the two pieces visually separate.

4. In the client-app folder, create the following files:

	* index.html: html5 shell
	* login.html: html5 shell
	* client-app.js: empty javascript file
	* backbone.js: from http://backbonejs.org/backbone.js
	* underscore.js: from http://underscorejs.org/underscore.js
	* json2.js: from https://github.com/douglascrockford/JSON-js
	* jquery-2.x.x.js: from http://jquery.com/

5. Create simple shell in index.html

7. Create note template in the index.html

6. Add some styling to the CSS

8. Define model, view, and hook it up to DOM for testing in client-app.js

		/*
		 * client-app.js
		 *
		 */
		function main() {

			/*
			 * define model for a note
			 */
			var Note = Backbone.Model.extend({
				defaults: {
					'name':'Untitled Note',
					'markdown':'[enter note text here]'
				},
				getNameHTML: function() {
					return this.get('name');
				},
				getBodyHTML: function() {
					return this.get('markdown');
				}
			});

			/*
			 * define view for a note
			 */
			var NoteView = Backbone.View.extend({
				tagName: 'article',
				className: 'note',
				template: _.template( $('#note-template').html() ),
				initialize: function() {
					this.render();
					$('#notes').append(this.$el);
				},
				render: function() {
					/*
					 * using getter functions to decouple view from
					 * technical details of data in the model
					 */
					var name = this.model.getNameHTML();
					var body = this.model.getBodyHTML();
					this.$el.html(this.template({'name':name, 'body':body}));
				}
			});

			/*
			 * a primitive test to check appearance
			 */
			var model1 = new Note();
			var view1 = new NoteView({'model':model1});

			/*
			 * define note collection
			 */
			var NoteList = Backbone.Collection.extend({
				model: Note
			});

			var notes = new NoteList();

		}

		$(document).ready(main);


10. Check appearance in browser

11. Now let's get the server part started. Add the following files to server-app/

	* server-app.js

12. Now create a file named "package.json" in the repository root. It's contents
should be the following:

		...

13. Now let's use NPM to install Express, a Node framework that streamlines
the creation of an app.

14. Now we can add express to the dependencies property in package.json

		...

15. Add the following code to client-app.js to set up our basic file server:

		var express = require('express');
		var app = express();
		app.listen(process.env.PORT || 8000);
		app.get('/', function(req, res) {
		res.sendfile('client-app/index.html');
		});
		app.use(express.directory('client-app'));
		app.use(express.static('client-app'));

15. Let's boot up the local test environment to confirm this works:

	At the command line:

		$ foreman start

	Then, in the browser, navigate to http://localhost:5000

	(To stop the simulation, type ^c at the command line.)

16. Now, set up an API endpoint that delivers sample data:

/* --- app setup --- */

var express = require('express');
var app = express();
app.listen(process.env.PORT || 8000);

/* --- data endpoints --- */

	app.get('/notes', function(req, res) {
		var testData = {'notes':[
			{'name':'Note 1', 'markdown':'Text of note 1'},
			{'name':'Note 2', 'markdown':'Text of note 2'},
			{'name':'Note 3', 'markdown':'Text of note 3'},
			{'name':'Note 4', 'markdown':'Text of note 4'},
			{'name':'Note 5', 'markdown':'Text of note 5'}
		]};
		res.send(testData);
	});

	/* --- file endpoints --- */

	app.get('/', function(req, res) {
		res.sendfile('client-app/index.html');
	});
	app.use(express.directory('client-app'));
	app.use(express.static('client-app'));
	 
17. You can test this endpoint in the browser by visiting 
http://localhost:5000/notes

	You should see the text of our testData JSON object.

18. Now let's return to client-app.js and have it properly retrieve data from the server app:

		/*
		 * client-app.js
		 *
		 */
		function main() {

			/*
			 * define model for a note
			 */
			var Note = Backbone.Model.extend({
				defaults: {
					'name':'Untitled Note',
					'markdown':'[enter note text here]'
				},
				getNameHTML: function() {
					return this.get('name');
				},
				getBodyHTML: function() {
					return this.get('markdown');
				}
			});

			/*
			 * define view for a note
			 */
			var NoteView = Backbone.View.extend({
				tagName: 'article',
				className: 'note',
				template: _.template( $('#note-template').html() ),
				render: function() {
					/*
					 * using getter functions to decouple view from
					 * technical details of data in the model
					 */
					var name = this.model.getNameHTML();
					var body = this.model.getBodyHTML();
					this.$el.html(this.template({'name':name, 'body':body}));
					// return self for chaining
					return this; 
				}
			});

			/*
			 * define note collection
			 */
			var NoteList = Backbone.Collection.extend({
				model: Note,
				url: '/notes',
				initialize: function(models, options) {
					this.fetch();
				}
			});

			/*
			 * define top-level view
			 */
			var AppView = Backbone.View.extend({
				el: $('#app'),
				initialize: function() {
					this.listenTo(this.collectionToMonitor, 'add', this.addNote);
				},
				addNote: function(note) {
					console.log('addNote');
					var view = new NoteView({'model':note})
					$('#notes').append(view.render().$el);
				},
				render: function() {
					
				} 
			});

			/*
			 * instantiate
			 */
			var notes = new NoteList();
			var app = new AppView({'collectionToMonitor':notes});
		}

		$(document).ready(main);

20. At the commandline, add a free mongo database

		$ heroku addons:add mongolab:sandbox

21. Heroku should have created an environment variable with your
login credential-bearing URI. At the command line:

		$ heroku config | grep MONGOLAB_URI

Store that in a local environment variable for testing purposes:

		$ export MONGO_LAB_URI=<paste in the URI here>

Add the following code to server-app.js, just before the data 
endpoints and run a foreman simulation to ensure that your
environment variables are set up correctly:

		/* --- mongolab --- */

		var mongoURI = process.env.MONGO_LAB_URI || process.env.MONGOLAB_URI || null;
		if (mongoURI == null) throw new Error('mongo uri env var not set up');

22. At the command line, install mongoose. We're going to use it to make
our database relationship simpler to manage:

		$ npm install mongoose

We then also need to add it to the dependencies in package.json.

23. Let's try to make a connection. This can be a major pain point if it
doesn't just work. Update the mongolab section of server-app.js as
follows:

		/* --- mongolab --- */

		var mongoURI = process.env.MONGO_LAB_URI || process.env.MONGOLAB_URI || null;
		if (mongoURI == null) throw new Error('mongo uri env var not set up');
		var mongoose = require('mongoose');
		mongoose.connect(mongoURI);
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function callback () {
			console.log('Successfully connected to mongo');
		});

Run a foreman simulation. If it seems
like you've done nothing wrong, but it's still failing, consider if you are behind 
a corporate firewall. You may have to install mongo locally and configure a test 
environment.









