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

/*
 * @class NoteEditView
 * @extends Backbone.View
 */
var NoteEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-note-pane',
	template: Handlebars.compile( $('#edit-note-template').html() ),
	initialize: function(options) {
		this.isNew = options.isNew;
		this.stacksCollection = options.stacksCollection;
		this.notesCollection = options.notesCollection;
		this.stackDropdownViews = [];
		var that = this;
		// create subview for each stack in list
		this.stacksCollection.each(function(stack) {
			if (stack.getDeleted() == false) {
				var view = new StackDropdownView({'model':stack});
				that.stackDropdownViews.push(view);
			}
		});
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		'click input.delete': 'deleteNote',
		'click input.close': 'saveAndCloseNote',
		'click input.js-cancel': 'cancel',
		'change select.js-add-to-stack-select': 'toggleCollectionMembership'
	},
	cancel: function(event) {
		event.stopPropagation();
		$('#app').show();
		this.remove();
	},
	deleteNote: function(event) {
		event.stopPropagation();
		var _this = this;
		this.model.setDeleted();
		this.saveNote(function(err, success) {
			$('#app').show();
			_this.remove();
		});
	},
	toggleCollectionMembership: function(event) {
		event.stopPropagation();
		console.log('NoteEditView.toggleCollectionMembership');
		var view = this;
		this.saveNote(function(err, success) {
			if (!err) {
				var selected = $('option', view.$el).filter(':selected').get(0);
				console.log('selected:');
				console.log(selected);
				// which stack view was interacted with?
				for(var i = 0; i < view.stackDropdownViews.length; i++) {
					var stackDropdownView = view.stackDropdownViews[i];
					if (selected === $(stackDropdownView.$el).get(0)) {
						console.log('  Invoking method of subview');
						stackDropdownView.toggleNoteMembership(view.model);
						view.render();
					}
				}
			}	
		});
	},
	saveNote: function(callback) {
		console.log('Attempting to save note');
		var name = $('.edit-name', this.$el).first().val();
		var markdown = $('.edit-markdown', this.$el).first().val();
		this.model.setName(name);
		this.model.setMarkdown(markdown);
		var _this = this;
		this.model.save(undefined,{
			error:function(model, xhr, options) {
				console.log('Failed to save note');
				console.log(xhr);
				callback('Failed to save note', false);
			},
			success:function(model, response, options){
				console.log('Successfully saved note');
				callback(null, true);
				if (_this.isNew) {
					console.log('Adding to notes collection');
					_this.notesCollection.add(model);
				}
			}
		});
	},
	saveAndCloseNote: function(event) {
		event.stopPropagation();
		var view = this;
		this.saveNote(function(err, success) {
			
			$('#app').show();
			view.remove();
		});
	},
	render: function() {
		$('#app').hide();
		var context = {
			'name': this.model.getName(), 
			'markdown': this.model.getMarkdown(),
			'isArchived': this.model.getDeleted()
		};
		Handlebars.registerHelper('archiveButtonValue', function() {
			if (this.isArchived) {
				return 'unarchive';
			} else {
				return 'archive';
			}
		});
		this.$el.html(this.template(context));
		for(var i = 0; i < this.stackDropdownViews.length; i++ ) {
			var view = this.stackDropdownViews[i];
			var stackModel = view.model;
			var noteId = this.model.getId();
			var shouldCheck = stackModel.hasNote(noteId);
			view.setChecked(shouldCheck);
			$('.js-add-to-stack-select', this.$el).append(view.render().$el);
		}
		return this; 
	}
});
