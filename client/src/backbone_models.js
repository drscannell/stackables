
/*
 * @class User
 * @extends Backbone.Model
 */
var User = Backbone.Model.extend({
	url: '/user',
	getUsername: function() {
		return this.get('username');
	},
	setUsername: function(username) {
		this.set('username', username);
	},
	getEmail: function() {
		return this.get('email');
	},
	setEmail: function(email) {
		this.set('email',email);
	},
	getStacks: function() {
		return this.get('stacks');
	},
	addStack: function(stackModel) {
		var obj = {
			'stackId':stackModel.getId(),
			'name':stackModel.getName()
		};
		this.get('stacks').push(obj);
		
	}
});

/*
 * @class Note
 * @extends Backbone.Model
 */
var Note = Backbone.Model.extend({
	defaults: {
		'name':'Untitled Note',
		'markdown':'',
		'deleted':false
	},
	url: function(){
		return '/note?id=' + this.get('_id');
	},
	getId: function() {
		return this.get('_id');
	},
	getName: function() {
		return this.get('name');
	},
	setName: function(newName) {
		this.set('name', newName);
	},
	getBodyHTML: function() {
		try {
			var htmlText =  marked(this.getMarkdown());
			return htmlText;
		} catch (ex) {
			return 'Markdown parser error: ' + ex
		}
	},
	getMarkdown: function(markdown) {
		return this.get('markdown');
	},
	setMarkdown: function(markdown) {
		this.set('markdown', markdown);
	},
	getDeleted: function() {
		return this.get('deleted');
	},
	setDeleted: function() {
		if (this.getDeleted()) {
			this.set('deleted', false);
		} else {
			this.set('deleted', true);
		}
	}
});

/**
 * @class Stack
 * @extends Backbone.Model
 */
var Stack = Backbone.Model.extend({
	defaults: {
		'name':'Untitled Stack',
		'notes':[]
	},
	//url: '/stack',
	url: function(){
		return '/stack?id=' + this.get('_id');
	},
	getId: function() {
		return this.get('_id');
	},
	getName: function() {
		return this.get('name');
	},
	setName: function(name) {
		this.set('name', name);
	},
	getDeleted: function() {
		//TODO: implement archiving for stacks
		return false;
	},
	getNotes: function() {
		return this.get('notes');
	},
	setNotes: function(notes) {
		this.set('notes', notes);
	},
	toggleNoteMembership: function(noteModel) {
		console.log('Stack.toggleNoteMembership');
		var noteId = noteModel.getId();
		var notes = this.get('notes')
		var index = notes.indexOf(noteId);
		if (index == -1) {
			notes.push(noteId);
		} else {
			notes.splice(index, 1);
		}
	},
	hasNote: function(noteId) {
		var notes = this.get('notes')
		if (notes.indexOf(noteId) == -1) {
			return false;
		}
		return true;
	}
});

/*
 * @class StackList
 * @extends Backbone.Collection
 */
var StackList = Backbone.Collection.extend({
	model: Stack,
	url: '/stacks',
	initialize: function(models, options) {
		this.fetch();
	}
});

/*
 * @class NoteList
 * @extends Backbone.Collection
 */
var NoteList = Backbone.Collection.extend({
	model: Note,
	url: function() {
		if (this.stackId) {
			return '/notes?stackId=' + this.stackId;
		} else {
			return '/notes';
		}
	},
	initialize: function(models, options) {
		this.stackId = null;
		if (options && 'stackId' in options) {
			this.stackId = options.stackId;
		}
		this.fetch();
	}
});
