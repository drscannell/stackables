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
		console.log('---initialize NoteEditView---');
		console.log(options.notesCollection);
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
		'click input.delete': 'handleArchiveClick',
		'click input.close': 'saveAndCloseNote',
		'click input.js-cancel': 'cancel',
		'change select.js-add-to-stack-select': 'handleStackToggle'
	},
	cancel: function(event) {
		event.stopPropagation();
		console.log('cancel');
		if (this.isNew) {
			console.log('aborting new note');
			// if aborting new note, delete
			this.deleteNote();
		} else {
			console.log('simple cancel');
			$('#app').show();
			this.remove();
		}
	},
	handleArchiveClick: function(event) {
		event.stopPropagation();
		this.deleteNote();
	},
	deleteNote: function() {
		console.log('---deleteNOte---');
		if (this.model.getId()) {
			var _this = this;
			this.model.setDeleted();
			this.saveNote(function(err, success) {
				$('#app').show();
				_this.remove();
			});
		} else {
			$('#app').show();
			this.remove();
		}
		console.log('+++deleteNote+++');
	},
	handleStackToggle: function(event) {
		event.stopPropagation();
		console.log('NoteEditView.handleStackToggle');
		var selected = $('option', this.$el).filter(':selected').get(0);
		console.log('selected:');
		console.log(selected);
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				var selected = $('option', _this.$el).filter(':selected').get(0);
				console.log('selected:');
				console.log(selected);
				// which stack view was interacted with?
				for(var i = 0; i < _this.stackDropdownViews.length; i++) {
					var stackDropdownView = _this.stackDropdownViews[i];
					if (selected === $(stackDropdownView.$el).get(0)) {
						console.log('  Invoking method of subview');
						//stackDropdownView.toggleNoteMembership(_this.model);
						var stackModel = stackDropdownView.model;
						_this.toggleStackMembership(stackModel)
						_this.render();
					}
				}
			}	
		});
	},
	toggleStackMembership: function(stackModel) {
		console.log('---NoteEditView.toggleStackMembership---');
		stackModel.toggleNoteMembership(this.model);
		this.saveModel(stackModel, function(err, success) {
			if (!err) {
				console.log('saved stack');
			} else {
				console.log('failed to save stack');
				console.log(err);
			}
		});
	},
	addToCollection: function(stackModel) {
		console.log('---NoteEditView.addToCollection---');
		stackModel.addNote(this.model);
		this.saveModel(stackModel, function(err, success) {
			if (!err) {
				console.log('saved stack');
			} else {
				console.log('failed to save stack');
				console.log(err);
			}
		});
	},
	removeFromCollection: function(stackModel) {
		console.log('---NoteEditView.removeFromCollection---');
		stackModel.removeNote(this.model);
		this.saveModel(stackModel, function(err, success) {
			if (!err) {
				console.log('saved stack');
			} else {
				console.log('failed to save stack');
				console.log(err);
			}
		});
	},
	saveNote: function(callback) {
		// gather values from UI
		var name = $('.edit-name', this.$el).first().val();
		var markdown = $('.edit-markdown', this.$el).first().val();
		this.model.setName(name);
		this.model.setMarkdown(markdown);
		// save to database
		var _this = this;
		this.saveModel(this.model, function(err, success) {
			if (!err) {
				console.log('Saved note');
			} else {
				console.log('Failed to save note');
				console.log(err);
			}
			if (callback)
				callback(err, success);
		});
	},
	saveModel: function(model, callback) {
		// generic model saving method
		var _this = this;
		model.save(undefined,{
			error:function(model, xhr, options) {
				console.log(xhr);
				if (callback)
					callback('Failed to save model', false);
			},
			success:function(model, response, options){
				if (callback)
					callback(null, true);
			}
		});
	},
	saveAndCloseNote: function(event) {
		event.stopPropagation();
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				if (_this.isNew) {
					console.log('Adding to notes collection');
					_this.notesCollection.add(_this.model);
				}
			}			
			$('#app').show();
			_this.remove();
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
