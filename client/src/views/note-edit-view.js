/*
 * @class NoteEditView
 * @extends Backbone.View
 */
var NoteEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-note-pane',
	template: Handlebars.compile($('#edit-note-template').html()),
	initialize: function(options) {
		// options
		this.isNew = options.isNew;
		this.stackId = options.stackId;
		this.stacksCollection = options.stacksCollection;
		this.notesCollection = options.notesCollection;
		this.populateStackDropdown(this.stacksCollection);
		this.listenTo(this.model, 'change', this.render);
		console.log('---initialize NoteEditView---');
		console.log('stackId: ' + this.stackId);
		console.log(this.stacksCollection);
		var initStack = this.stacksCollection.findWhere({
			_id: this.stackId
		});
		if (initStack) {
			console.log('lets add this bad boy');
			this.addToStack(initStack);
		}
	},
	populateStackDropdown: function(stacksCollection) {
		this.stackMembershipViews = [];
		var _this = this;
		// create subview for each stack in list
		this.stacksCollection.each(function(stack) {
			if (stack.getDeleted() == false) {
				var view = new StackMembershipView({'model':stack});
				_this.stackMembershipViews.push(view);
			}
		});
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
				for(var i = 0; i < _this.stackMembershipViews.length; i++) {
					var stackMembershipView = _this.stackMembershipViews[i];
					if (selected === $(stackMembershipView.$el).get(0)) {
						console.log('  Invoking method of subview');
						//stackMembershipView.toggleNoteMembership(_this.model);
						var stackModel = stackMembershipView.model;
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
	addToStack: function(stackModel) {
		console.log('---NoteEditView.addToCollection---');
		console.log('this.model: ' + this.model);
		var _this = this;
		this.saveNote(function(err, success) {
			if (!err) {
				stackModel.addNote(_this.model);
				_this.saveModel(stackModel, function(err, success) {
					if (!err) {
						console.log('saved stack');
						_this.render();
					} else {
						console.log('failed to save stack');
						console.log(err);
					}
				});
			}
		});
	},
	removeFromStack: function(stackModel) {
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
		// can this be moved to external controller?
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
