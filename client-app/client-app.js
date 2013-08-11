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
			'markdown':'[enter note text here]',
			'deleted':false
		},
		url: '/note',
		getNameHTML: function() {
			return this.get('name');
		},
		setName: function(newName) {
			this.set('name', newName);
		},
		getBodyHTML: function() {
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
			console.log('url: ' + this.url);
			this.save();
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
			'click input.edit': 'editNote'
		},
		deleteNote: function(event) {
			event.stopPropagation();
			console.log('delete note');
			this.model.setDeleted(true);
		},
		editNote: function(event) {
			event.stopPropagation();
			console.log('edit note');
		},
		render: function() {
			console.log(this.model.toJSON());
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
		initialize: function(options) {
			this.collectionToMonitor = options.collectionToMonitor;
			this.listenTo(this.collectionToMonitor, 'add', this.addNote);
		},
		addNote: function(note) {
			var view = new NoteView({'model':note});
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
