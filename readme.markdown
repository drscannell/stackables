# Stackables #

Stackables is a markdown-focused notes app.

- Write notes in markdown
- View notes as HTML
- Group notes in stacks

## Dependencies ##

This web app is built on the following base:

- [express](http://expressjs.com/)
- [backbone](http://backbonejs.org/)
- [handlebars](http://handlebarsjs.com/)
- [jquery](http://jquery.com/)
- [marked](https://github.com/chjj/marked)
- [mongodb](http://www.mongodb.org/)

## Setting Up Local Test Database (OSX) ##

1. Install mongodb
2. Start mongo instance

	I like to set up a folder for storing my database files.

		$ mongod --dbpath ~/apps/mongo-database-files

3. Open mongo shell

		$ mongo

4. Kickstart stackables database

		> use stackables
		> db.users.insert({"email" : "test@test.test", "password" : "098f6bcd4621d373cade4e832627b4f6", "stacks" : [], "username" : "test" })


5. Confirm that you actually added it


		> db.users.find()


6. Back at the root of the repository, add environment variable for our db

		$ export LOCAL_MONGO_URI="mongodb://localhost:27017/stackables?safe=true&auto_reconnect=true"

7. Start the server

		$ cake try

8. Visit http://localhost:8000 and Log in

	- name: test
	- pass: test

### Next time, you can just do the following: ###

Run mongo instance:

	$ mongod --dbpath ~/apps/mongo-database-files

Add environment variable:

	$ export LOCAL_MONGO_URI="mongodb://localhost:27017/stackables?safe=true&auto_reconnect=true"
