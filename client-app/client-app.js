/**
 * client-app.js
 *
 */


function main() {
	
	/*
	 * This app is mobile-first.
	 * If not touch screen, trigger
	 * desktop enhancements by adding
	 * class to the body
	 */
	if ( !('ontouchstart' in window) ) {
		$('body').addClass('not-mobile');
	}

	/*
	 * configure markdown parser
	 */
	marked.setOptions({
		gfm: true,
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: false,
		langPrefix: 'lang-'
	});

	/*
	 * instantiate
	 */
	var notes = new NoteList();
	var app = new AppView({'collectionToMonitor':notes});
}

/*
 * @class User
 * @extends Backbone.Model
 */
var User = Backbone.Model.extend({
	url: '/user',
	validate: function(attrs, options) {
		var errors = [];
		if (!this.isValidColorCode(attrs.colorScheme.appColor)) {
			errors.push({
				'message':'Invalid app color code',
				'class':'appColor'
			});
		}
		if (!this.isValidColorCode(attrs.colorScheme.noteColor)) {
			errors.push({
				'message':'Invalid note color code',
				'class':'noteColor'
			});
		}
		if (!this.isValidColorCode(attrs.colorScheme.buttonColor)) {
			errors.push({
				'message':'Invalid button color code',
				'class':'buttonColor'
			});
		}
		if (errors.length > 0) {
			return errors;
		}
	},
	isValidColorCode: function(string) {
		try {
			return string.match(/^#([0-9abcdef]{6}|[0-9abcdef]{3})$/i);
		} catch(ex) {
			console.log(ex);
			return false;
		}
	},
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
	getDefaultColorScheme: function() {
		var defaultColorScheme = {
			'appColor':'#33cccc',
			'noteColor':'#66cc66',
			'buttonColor':'#336666'
		};
		return defaultColorScheme;
	},
	getColorScheme: function() {
		var colorScheme =  this.get('colorScheme') || this.getDefaultColorScheme();
		return $.extend(true,{},colorScheme);
	},
	setColorScheme: function(colorScheme) {
		this.set('colorScheme', colorScheme);
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
		'markdown':'[enter note text here]',
		'deleted':false
	},
	url: function(){
		return '/note?id=' + this.get('_id');
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
	setDeleted: function(newDeleted) {
		this.set('deleted', newDeleted);
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
	url: '/stack',
	getId: function() {
		return this.get('_id');
	},
	getName: function() {
		return this.get('name');
	},
	setName: function(name) {
		this.set('name', name);
	},
	getNotes: function() {
		return this.get('notes');
	},
	setNotes: function(notes) {
		this.set('notes', notes);
	}
});

/*
 * @class NoteList
 * @extends Backbone.Collection
 */
var NoteList = Backbone.Collection.extend({
	model: Note,
	url: '/notes',
	initialize: function(models, options) {
		this.fetch();
	}
});

/*
 * @class StackList
 * @extends Backbone.Collection
 */
var StackList = Backbone.Collection.extend({
	model: Note,
	url: function() {
		return '/stacks';
	},
	initialize: function(models, options) {
		this.fetch();
	}
});

/**
 * @class StackEditView
 * @extends Backbone.View
 */
var StackEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-view',
	template: _.template( $('#edit-stack-template').html() ),
	initialize: function(options) {
		
	},
	events: {
		'click input.close': 'saveAndClose',
		'click input.delete': 'archive'
	},
	saveAndClose: function(event) {
		console.log('save and close');
		// TODO: save to server
		event.stopPropagation();
		var name = $('.js-stack-name', this.$el).first().val();
		var notes = [];
		this.model.setName(name);
		this.model.setNotes(notes);
		this.model.save(undefined, {
			userModel: this.options.userModel,
			error:function(){
				console.log('error');
			},
			success:function(model, response, options){
				console.log('success');
				console.log(model);
				options.userModel.addStack(model);
				options.userModel.save();
			}
		});
		$('#app').show();
		this.remove();
		// TODO: if successful, add to user model
	},
	archive: function(event) {
		console.log('archive stack');
	},
	render: function() {
		$('#app').hide();
		var stackName = this.model.getName();
		this.$el.html(this.template({
			'stackName':stackName
		}));
		return this; 
	}
});

/*
 * @class UserEditView 
 * @extends Backbone.View
 */
var UserEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-user-pane',
	template: _.template( $('#edit-user-template').html() ),
	initialize: function(options) {
		this.listenTo(this.model, 'invalid', this.reportValidationErrors);
		console.log('getStacks()');
		console.log(this.model.getStacks());
	},
	events: {
		'click input.close': 'saveAndClose',
		'click input.default-colors': 'applyDefaultColorScheme',
		'input input.js-color-input': 'handleColorChange'
	},
	saveAndClose: function(event) {
		event.stopPropagation();
		this.updateModel();
		if (this.model.save()) {
			$('#app').show();
			this.remove();
		}
	},
	updateModel: function() {
		var email = $('.edit-email', this.$el).first().val();
		this.model.setEmail(email);
		var appColor = $('.appColor > input', this.$el).first().val();
		var noteColor = $('.noteColor > input', this.$el).first().val();
		var buttonColor = $('.buttonColor > input', this.$el).first().val();
		this.model.setColorScheme({
			'appColor': appColor,
			'noteColor': noteColor,
			'buttonColor': buttonColor
		});

	},
	handleColorChange: function() {
		this.updateModel();
		if (this.model.save()) {
			/*
			 * update color css
			 */
			$('head').append('<link type="text/css" rel="stylesheet" href="color-scheme.css" />');
			this.markAllInputsValid();
		}
	},
	markAllInputsValid: function() {
		$('.js-input-container', this.$el).removeClass('error').addClass('success');
	},
	applyDefaultColorScheme: function() {
		var defaults = this.model.getDefaultColorScheme();
		$('.appColor > input', this.$el).first().val(defaults.appColor);
		$('.noteColor > input', this.$el).first().val(defaults.noteColor);
		$('.buttonColor > input', this.$el).first().val(defaults.buttonColor);
		$('.text-input', this.$el).removeClass('error').addClass('success');
		this.handleColorChange();
	},
	reportValidationErrors: function(model, errors) {
		$('.text-input', this.$el).removeClass('error').addClass('success');
		_.each(errors, function(error, i) {
			var query = '.' + error.class;
			$(query, this.$el).addClass('error');
		});
	},
	render: function() {
		$('#app').hide();
		var username = this.model.getUsername();
		var email = this.model.getEmail();
		var colorScheme = this.model.getColorScheme();
		this.$el.html(this.template({
			'username':username, 
			'email':email,
			'appColor': colorScheme.appColor,
			'noteColor': colorScheme.noteColor,
			'buttonColor': colorScheme.buttonColor
		}));
		return this; 
	}
});

/*
 * @class NoteView
 * @extends Backbone.View
 */
var NoteView = Backbone.View.extend({
	tagName: 'article',
	className: 'note inactive-note',
	template: _.template( $('#note-template').html() ),
	initialize: function(options) {
		/*
		 * re-render when model changes
		 */
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		'click input.delete': 'deleteNote',
		'click input.edit': 'editNote',
		'click h1.note': 'toggleActive'
	},
	toggleActive: function(event) {
		event.stopPropagation();
		event.preventDefault();
		this.model.fetch();
		$(this.$el).toggleClass('inactive-note');
	},
	deleteNote: function(event) {
		event.stopPropagation();
		this.model.setDeleted(true);
		this.model.save();
		this.remove();
	},
	editNote: function(event) {
		event.stopPropagation();
		// invoke edit note view after fetch
		if ( this.model.get('_id') ) {
			this.model.fetch();
		}
		var editView = new NoteEditView({'normalView':this, 'model':this.model});
		$('body').append(editView.render().$el);
	},
	render: function() {
		if ( this.model.getDeleted() ) {
			this.remove();
		} else {
			var name = this.model.getName();
			var bodyHTML = jQuery.parseHTML(this.model.getBodyHTML());
			this.$el.html(this.template({'name':name}));
			$('.note-body', this.$el).first().append(bodyHTML);
		}
		return this; 
	}
});

/*
 * @class NoteEditView
 * @extends Backbone.View
 */
var NoteEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-note-pane',
	template: _.template( $('#edit-note-template').html() ),
	initialize: function(options) {
		/*
		 * re-render when model changes
		 */
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		'click input.delete': 'deleteNote',
		'click input.close': 'saveAndCloseNote'
	},
	deleteNote: function(event) {
		event.stopPropagation();
		this.model.setDeleted(true);
		this.model.save();
		$('#app').show();
		this.remove();
	},
	saveAndCloseNote: function(event) {
		event.stopPropagation();
		var name = $('.edit-name', this.$el).first().val();
		var markdown = $('.edit-markdown', this.$el).first().val();
		this.model.setName(name);
		this.model.setMarkdown(markdown);
		this.model.save();
		$('#app').show();
		this.remove();
	},
	render: function() {
		$('#app').hide();
		var name = this.model.getName();
		var markdown = this.model.getMarkdown();
		this.$el.html(this.template({'name':name, 'markdown':markdown}));
		return this; 
	}
});

/*
 * @class AppView
 * @extends Backbone.View
 */
var AppView = Backbone.View.extend({
	el: $('#app'),
	initialize: function(options) {
		this.userModel = new User();
		this.userModel.fetch();
		this.collectionToMonitor = options.collectionToMonitor;
		this.listenTo(this.collectionToMonitor, 'add', this.addNoteView);
		this.listenTo(this.userModel, 'change', this.userChange);
	},
	events: {
		'click input.js-add-note': 'addNewNote',
		'click input.js-add-stack': 'addNewStack',
		'click input.js-logout': 'logout',
		'click input.js-settings': 'showSettingsView'
	},
	addNewNote: function() {
		var note = new Note();
		this.collectionToMonitor.add(note);
		var view = new NoteEditView({'model':note});
		$('body').append(view.render().$el);
	},
	addNewStack: function() {
		console.log('add new stack');
		var stack = new Stack();
		var view = new StackEditView({'model':stack, 'userModel':this.userModel});
		$('body').append(view.render().$el);
	},
	addNoteView: function(note) {
		var view = new NoteView({'model':note});
		$('#notes').prepend(view.render().$el);
	},
	showSettingsView: function(){
		var editView = new UserEditView({'model':this.userModel});
		$('body').append(editView.render().$el);
			
	},
	logout: function() {
		jQuery.post('logout', function(data) {
			location.reload();
		});
	},
	render: function() {
		
	} 
});

$(document).ready(main);
