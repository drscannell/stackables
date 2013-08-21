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
				var htmlText =  marked( this.get('markdown') );
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
			console.log('set active');
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
			console.log('render');
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
			//this.options.normalView.remove();
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
			//this.options.normalView.render();
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
			this.collectionToMonitor = options.collectionToMonitor;
			this.listenTo(this.collectionToMonitor, 'add', this.addNoteView);
		},
		events: {
			'click input.add': 'addNewNote',
			'click input.logout': 'logout'
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
