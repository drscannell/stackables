/*
 * @class NoteView
 * @extends Backbone.View
 */
var NoteView = Backbone.View.extend({
	tagName: 'article',
	className: 'note inactive-note',
	template: Handlebars.compile( $('#note-template').html() ),
	initialize: function(options) {
		this.stacksCollection = options.stacksCollection;
		this.listenTo(this.model, 'change', this.render);
		this.showUnarchivedNotes = options.showUnarchivedNotes;
		this.showArchivedNotes = options.showArchivedNotes;
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
		console.log('this.stacksCollection: ' + this.stacksCollection);
		var editView = new NoteEditView({
			'normalView':this, 
			'isNew':false,
			'model':this.model,
			'stacksCollection':this.stacksCollection
		});
		$('body').append(editView.render().$el);
	},
	render: function() {
		var isArchived = this.model.getDeleted();
		if ( isArchived && !this.showArchivedNotes ) {
			this.remove();
		} else if (!isArchived && !this.showUnarchivedNotes) {
			this.remove();
		} else {
			var bodyHTML = jQuery.parseHTML(this.model.getBodyHTML());
			var context = {
				'name': this.model.getName()
			};
			this.$el.html(this.template(context));
			$('.note-body', this.$el).first().append(bodyHTML);
		}
		return this; 
	}
});

