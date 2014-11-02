/*
 * @class NoteSkimView
 * @extends Backbone.View
 */
var NoteSkimView = Backbone.View.extend({
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
		'click':'showMasterView'
	},
	/*
	events: {
		'click input.delete': 'deleteNote',
		'click input.edit': 'editNote',
		'click h1.note': 'toggleActive'
	},
	*/
	showMasterView: function(event) {
		console.log('showMasterView');
		var view = new NoteMasterView({
			'model':this.model, 
			'stacksCollection':this.stacksCollection
		});
		$('body').append(view.render().$el);
	},
	toggleActive: function(event) {
		event.stopPropagation();
		event.preventDefault();
		var _this = this;
		this.model.fetch();
		$(this.$el).toggleClass('inactive-note');
		if (!this.$el.hasClass('inactive-note')) {
			$('.note-body', this.$el).slideDown(200, function(){
				_this.makeVisible();
			});
		} else {
			$('.note-body', this.$el).slideUp(200);
		}
	},
	/** Scroll the body so that this note is visible 
	 * @param {Function} optional callback */
	makeVisible: function(callback) {
		var scroller = $('body');
		var padTop = 10;
		var scrollTo = this.$el.offset().top - padTop;
		var distance = Math.abs(scrollTo - scroller.scrollTop());
		scroller.animate({
				scrollTop: scrollTo
		}, distance, function(){if(callback)callback();});
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


