/*
 * client-app.js
 *
 */
function main() {

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
		url: '/note',
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
	 * define view for a note
	 */
	var NoteView = Backbone.View.extend({
		tagName: 'article',
		className: 'note',
		template: _.template( $('#note-template').html() ),
		events: {
			'click input.delete': 'deleteNote',
			'click input.edit': 'editNote',
			'click h1.note-heading': 'toggleActive'
		},
		toggleActive: function(event) {
			event.stopPropagation();
			event.preventDefault();
			console.log('set active');
			$('section.note-body', this.$el).toggleClass('inactive-note');
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
			// invoke edit note view
			var editView = new EditNoteView({'normalView':this, 'model':this.model});
			$('body').append(editView.render().$el);
		},
		render: function() {
			var name = this.model.getName();
			var bodyHTML = jQuery.parseHTML(this.model.getBodyHTML());
			this.$el.html(this.template({'name':name}));
			$('.note-body', this.$el).first().append(bodyHTML);
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
		events: {
			'click input.delete': 'deleteNote',
			'click input.close': 'saveAndCloseNote'
		},
		deleteNote: function(event) {
			event.stopPropagation();
			console.log('delete note');
			this.model.setDeleted(true);
			this.model.save();
			this.options.normalView.remove();
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
			this.options.normalView.render();
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
		initialize: function(options) {
			this.collectionToMonitor = options.collectionToMonitor;
			this.listenTo(this.collectionToMonitor, 'add', this.addNote);
		},
		events: {
			'click input.add': 'addNewNote'
		},
		addNewNote: function() {
			//var newNote = new Note();
			//this.collectionToMonitor.add(newNote);
			this.collectionToMonitor.create();
		},
		addNote: function(note) {
			var view = new NoteView({'model':note});
			$('#notes').prepend(view.render().$el);
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
