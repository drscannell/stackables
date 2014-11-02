/*
 * @class NoteMasterView
 * @extends Backbone.View
 */
var NoteMasterView = Backbone.View.extend({
	tagName: 'article',
	className: 'note-master-view',
	template: Handlebars.compile( $('#note-master-view-template').html() ),
	initialize: function(options) {
		console.log('fetch!');
		this.model.fetch();
		this.stacksCollection = options.stacksCollection;
		this.listenTo(this.model, 'change', this.render);
		this.showUnarchivedNotes = options.showUnarchivedNotes;
		this.showArchivedNotes = options.showArchivedNotes;
	},
	events: {
		'click .js-close': 'closeView',
		'click .js-edit': 'editNote'
	},
	closeView: function(event) {
		event.preventDefault();
		this.remove();
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
		console.log('note-master-render');
		console.log(this.model);
		var bodyHTML = this.model.getBodyHTML();
		//var bodyHTML = jQuery.parseHTML(this.model.getBodyHTML());
		console.log(bodyHTML);
		var context = {
			'name': this.model.getName(),
			'body': bodyHTML
		};
		this.$el.html(this.template(context));
		
		/*
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
		*/
		return this; 
	}
});

