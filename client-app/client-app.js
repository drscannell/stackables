/*
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
	 * define model for a note
	 */
	var Note = Backbone.Model.extend({
		defaults: {
			'name':'Untitled Note',
			'markdown':'[enter note text here]',
			'deleted':false
		},
		url: function(){return '/note?id=' + this.get('_id')},
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
	
	/*
	 * define model for user
	 */
	var User = Backbone.Model.extend({
		url: '/user',
		validate: function(attrs, options) {
			console.log('Validating User Attributes');
			var errorMessage = [];
			if (!this.isValidColorCode(attrs.colorScheme.appColor)) {
				errorMessage.push('Invalid app color code');
			}
			if (!this.isValidColorCode(attrs.colorScheme.noteColor)) {
				errorMessage.push('Invalid note color code');
			}
			if (!this.isValidColorCode(attrs.colorScheme.buttonColor)) {
				errorMessage.push('Invalid button color code');
			}
			if (errorMessage.length > 0) {
				console.log('Invalid fields!');
				return errorMessage;
			}
		},
		isValidColorCode: function(string) {
			try {
				return string.match(/^#([0-9abcdef]{6}|[0-9abcdef]{3})$/);
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
		}
	});

	/*
	 * define edit view for user
	 */
	var EditUserView = Backbone.View.extend({
		tagName: 'div',
		className: 'edit-user-pane',
		template: _.template( $('#edit-user-template').html() ),
		initialize: function(options) {
			this.listenTo(this.model, 'invalid', this.reportValidationErrors);
		},
		events: {
			'click input.close': 'saveAndClose',
			'click input.default-colors': 'applyDefaultColorScheme'
		},
		saveAndClose: function(event) {
			event.stopPropagation();
			console.log('save and close user');
			var email = $('.edit-email', this.$el).first().val();
			this.model.setEmail(email);
			var appColor = $('.edit-app-color', this.$el).first().val();
			var noteColor = $('.edit-note-color', this.$el).first().val();
			var buttonColor = $('.edit-button-color', this.$el).first().val();
			this.model.setColorScheme({
				'appColor': appColor,
				'noteColor': noteColor,
				'buttonColor': buttonColor
			});
			if (this.model.save()) {
				this.remove();
			}
		},
		applyDefaultColorScheme: function() {
			console.log('Applying default color scheme');
			var defaults = this.model.getDefaultColorScheme();
			$('.edit-app-color', this.$el).first().val(defaults.appColor);
			$('.edit-note-color', this.$el).first().val(defaults.noteColor);
			$('.edit-button-color', this.$el).first().val(defaults.buttonColor);
		},
		reportValidationErrors: function(model) {
			console.log('reportValidationErrors:');
			$('div.errors', this.$el).empty();
			for(i in model.validationError) {
				console.log( model.validationError[i] );
				$('div.errors', this.$el).append('<p></p>').append(model.validationError[i]);
			}
		},
		render: function() {
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
	 * define view for a note
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
			'click h1.note-heading': 'toggleActive'
		},
		toggleActive: function(event) {
			event.stopPropagation();
			event.preventDefault();
			this.model.fetch();
			$(this.$el).toggleClass('inactive-note');
		},
		deleteNote: function(event) {
			event.stopPropagation();
			console.log('delete note');
			this.model.setDeleted(true);
			this.model.save();
			this.remove();
		},
		editNote: function(event) {
			event.stopPropagation();
			console.log('edit note');
			// invoke edit note view after fetch
			if ( this.model.get('_id') ) {
				this.model.fetch();
			}
			var editView = new EditNoteView({'normalView':this, 'model':this.model});
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
	 * define edit view for note
	 */
	var EditNoteView = Backbone.View.extend({
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
			console.log('delete note');
			this.model.setDeleted(true);
			this.model.save();
			this.remove();
		},
		saveAndCloseNote: function(event) {
			event.stopPropagation();
			console.log('save and close note');
			var name = $('.edit-name', this.$el).first().val();
			var markdown = $('.edit-markdown', this.$el).first().val();
			this.model.setName(name);
			this.model.setMarkdown(markdown);
			this.model.save();
			this.remove();
		},
		render: function() {
			var name = this.model.getName();
			var markdown = this.model.getMarkdown();
			this.$el.html(this.template({'name':name, 'markdown':markdown}));
			return this; 
		}
	});

	/*
	 * define top-level view
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
			'click input.add': 'addNewNote',
			'click input.logout': 'logout',
			'click input.settings': 'showSettingsView'
		},
		addNewNote: function() {
			var note = new Note();
			this.collectionToMonitor.add(note);
			var editView = new EditNoteView({'model':note});
			$('body').append(editView.render().$el);
		},
		addNoteView: function(note) {
			var view = new NoteView({'model':note});
			$('#notes').prepend(view.render().$el);
		},
		showSettingsView: function(){
			console.log('username: ' + this.userModel.getUsername() );
			var editView = new EditUserView({'model':this.userModel});
			$('body').append(editView.render().$el);
				
		},
		userChange: function() {
			console.log('userChange');
			var colorScheme = this.userModel.getColorScheme();
			this.updateColorScheme(colorScheme);
		},
		updateColorScheme: function(colorScheme) {
			/*
			$('header, footer').css('background',colorScheme.appColor);
			$('h1.note-heading').css('background', colorScheme.noteColor);
			$('body.not-mobile h1.note-heading').hover(
				function(){
					$(this).css('background', colorScheme.buttonColor);
				},
				function(){
					$(this).css('background', colorScheme.noteColor);
				});
			$('input.button').css('background', colorScheme.buttonColor);
			$('body.not-mobile input.button').hover(
				function(){
					$(this).css('background', colorScheme.noteColor);
				},
				function(){
					$(this).css('background', colorScheme.buttonColor);
				});
			*/
		},
		logout: function() {
			jQuery.post('logout', function(data) {
				location.reload();
			});
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
