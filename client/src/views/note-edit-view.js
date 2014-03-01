/*
 * @class NoteEditView
 * @extends Backbone.View
 */
//var NoteEditView = Backbone.View.extend({
var NoteEditView = ControllerView.extend({
	tagName: 'div',
	className: 'edit-note-pane',
	template: Handlebars.compile($('#edit-note-template').html()),
	initialize: function(options) {
		this.populateStackDropdown(this.options.stacksCollection);
		this.listenTo(this.model, 'change', this.render);
		this.initializeStackMembership();
	},
	/** Add views for each stack to dropdown. After this
	 * they will manage themselves by listening to their
	 * models. We are only interested in the stack id
	 * in the <option> value attributes.
	 * @param {Backbone.Collection} collection from which to source */
	populateStackDropdown: function(stacksCollection) {
		this.stackMembershipViews = [];
		var _this = this;
		this.options.stacksCollection.each(function(stack) {
			if (stack.getDeleted() == false) {
				var view = new StackMembershipView({'model':stack});
				_this.stackMembershipViews.push(view);
			}
		});
	},
	/** If new note launched by particular stack, this note
	 * should be a member of it. */
	initializeStackMembership: function() {
		if (this.options.isNew) {
			var initStack = this.getStackById(this.options.stackId);
			if (initStack) {
				this.addToStack(initStack);
			}
		}
	},
	events: {
		'click input.delete': 'handleArchive',
		'click input.close': 'handleSaveAndClose',
		'click input.js-cancel': 'handleCancel',
		'change select.js-add-to-stack-select': 'handleStackToggle'
	},
	handleArchive: function(event) {
		event.stopPropagation();
		this.deleteNote();
	},
	handleSaveAndClose: function(event) {
		event.stopPropagation();
		this.saveAndCloseNote();
	},
	handleCancel: function(event) {
		event.stopPropagation();
		console.log('cancel');
		if (this.options.isNew) {
			console.log('aborting new note');
			// if aborting new note, delete
			this.deleteNote();
		} else {
			console.log('simple cancel');
			$('#app').show();
			this.remove();
		}
	},
	handleStackToggle: function(event) {
		event.stopPropagation();
		var selectedStackId = $('option:selected', this.$el).first().val();
		var selectedStack = this.getStackById(selectedStackId);
		if (selectedStack && this.model.getId()) {
			this.toggleStackMembership(selectedStack);
		} else if (selectedStack) {
			this.saveThenToggleStackMembership(selectedStack);
		} else {
			console.log('invalid stack id');
		}
	},
	deleteNote: function() {
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
	},
	getStackById: function(stackId) {
		return this.options.stacksCollection.findWhere({
			_id: stackId
		});
	},
	saveThenToggleStackMembership: function(stackModel) {
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				console.log('saved note');
				_this.toggleStackMembership(stackModel);
			}	else {
				console.log('failed to save note: ' + err);
			}
		});
	},
	toggleStackMembership: function(stackModel) {
		stackModel.toggleNoteMembership(this.model);
		var _this = this;
		this.saveModel(stackModel, function(err, success) {
			if (!err) {
				console.log('saved stack');
				_this.render();
			} else {
				console.log('failed to save stack');
				console.log(err);
			}
		});
	},
	addToStack: function(stackModel) {
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				stackModel.addNote(_this.model);
				_this.saveModel(stackModel, function(err, success) {
					if (!err) {
						console.log('saved stack');
						_this.render();
					} else {
						console.log('failed to save note: ' + err);
					}
				});
			}
		});
	},
	removeFromStack: function(stackModel) {
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				stackModel.removeNote(_this.model);
				_this.saveModel(stackModel, function(err, success) {
					if (!err) {
						console.log('saved stack');
						_this.render();
					} else {
						console.log('failed to save note: ' + err);
					}
				});
			}
		});
	},
	/** Gathers values from UI and saves model.
	 * @param {Function} optional callback */
	saveNote: function(callback) {
		var name = $('.edit-name', this.$el).first().val();
		var markdown = $('.edit-markdown', this.$el).first().val();
		this.model.setName(name);
		this.model.setMarkdown(markdown);
		var _this = this;
		this.saveModel(this.model, function(err, success) {
			if (!err) {
				console.log('saved note');
			} else {
				console.log('failed to save note: ' + err);
			}
			if (callback)
				callback(err, success);
		});
	},
	/** Save note, add to current collection if new, and close view. */
	saveAndCloseNote: function() {
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				if (_this.options.isNew) {
					_this.options.notesCollection.add(_this.model);
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
			'isArchived': this.model.getDeleted(),
			'archiveButton': this.model.getDeleted() ? 'unarchive' : 'archive'
		};
		this.$el.html(this.template(context));
		for(var i = 0; i < this.stackMembershipViews.length; i++ ) {
			var view = this.stackMembershipViews[i];
			var stackModel = view.model;
			var noteId = this.model.getId();
			var shouldCheck = stackModel.hasNote(noteId);
			view.setChecked(shouldCheck);
			$('.js-add-to-stack-select', this.$el).append(view.render().$el);
		}
		return this; 
	}
});
