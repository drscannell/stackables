/*
 * @class AppView
 * @extends Backbone.View
 */
var AppView = Backbone.View.extend({
	el: $('#app'),
	initialize: function(options) {
		// options
		this.allNotesCollection = options.notesCollection;
		this.stacksCollection = options.stacksCollection;
		// init fields
		this.stackId = null;
		this.stackViews = [];
		// get user from server based on cookie (?)
		this.userModel = new User();
		this.userModel.fetch();
		// display initial stack
		this.showStack('all');
		// init listeners
		this.listenTo(this.stacksCollection, 'add', this.addStackSelectorView);
		this.listenTo(this.stacksCollection, 'change', this.refreshStackSelectorViews);
		this.listenTo(this.userModel, 'change', this.userChange);
		$(window).focus({'_this':this}, this.handleWindowFocus);
	},
	events: {
		'click input.js-add-note': 'handleNewNote',
		'click input.js-add-stack': 'handleNewStack',
		'click input.js-logout': 'handleLogout',
		'click input.js-settings': 'handleShowSettings',
		'change select.js-stack-select': 'handleShowStack'
	},
	/** On window focus, reset the collection.
	 * Reset event handled elsewhere
	 * @param {$Event} jQuery Event */
	handleWindowFocus: function(event) {
		var _this = event.data._this;
		_this.notesCollection.fetch({reset:true});
	},
	handleShowStack: function(event) {
		event.stopPropagation();
		var stackId = $(event.currentTarget).val();
		this.showStack(stackId);
	},
	showStack: function(stackId) {
		console.log('AppView.showStack: ' + stackId);
		if (stackId !== this.stackId) {
			this.stopListening(this.notesCollection, 'add');
			$('#notes').empty();
			this.stackId = stackId;
			this.isShowingArchive = (stackId === 'archived');
			this.notesCollection = new NoteList([], {'stackId':stackId});
			this.listenTo(this.notesCollection, 'add', this.addNoteView);
			this.listenTo(this.notesCollection, 'reset', this.handleReset);
		}
	},
	/** When notes collection reset, see if any are new. If so,
	 * add to UI. This only works on desktop right now. There
	 * doesn't seem to be a way to detect window focus in mobile.
	 * @param {Backbone.Collection.ResetEvent?}
	 * @param {Backbone.Collection.ResetOptions?} */
	handleReset: function(ev, options) {
		/*
		var _this = this;
		ev.models.forEach(function(model) {
			var isOld = _.find(options.previousModels, function(m){
				return m.getId() === model.getId();
			});
			if (!isOld) {
				_this.addNoteView(model);
			}
		});
		*/
	},
	handleNewNote: function(event) {
		event.stopPropagation();
		this.newNote();
	},
	newNote: function() {
		var stackIdToAddTo = this.stackId;
		if (stackIdToAddTo === 'all' || stackIdToAddTo === 'archived')
			stackIdToAddTo = null;
		var note = new Note();
		var view = new NoteEditView({
			'isNew':true,
			'model':note,
			'stacksCollection':this.stacksCollection,
			'notesCollection':this.notesCollection,
			'stackId':stackIdToAddTo
		});
		$('body').append(view.render().$el);
	},
	handleNewStack: function(event) {
		event.stopPropagation();
		this.newStack();
	},
	newStack: function() {
		var stack = new Stack();
		var view = new StackCreateView({
			'model':stack, 
			'userModel':this.userModel,
			'stacksCollection':this.stacksCollection
		});
		$('body').append(view.render().$el);
	},
	addNoteView: function(note) {
		var view = new NoteView({
			'model':note, 
			'stacksCollection':this.stacksCollection,
			'showUnarchivedNotes':(this.isShowingArchive == false),
			'showArchivedNotes':(this.isShowingArchive == true)
		});
		$('#notes').prepend(view.render().$el);

		
	},
	addStackSelectorView: function(stack) {
		if (stack.getDeleted() == false) {
			var view = new StackSelectorView({'model':stack});
			$('.js-stack-select').append(view.render().$el);
			this.stackViews.push(view);
		}
	},
	refreshStackSelectorViews: function(stack) {
		var _this = this;
		//<option value="all">All Notes</option>
		//<option value="archived">Archived Notes</option>
		$('.js-stack-select').children().not('.js-permanent').detach();
		this.stacksCollection.each(function(stack) {
			_this.addStackSelectorView(stack);
		});
	},
	handleShowSettings: function(){
		var editView = new UserEditView({
			'model':this.userModel,
			'stacksCollection':this.stacksCollection
		});
		$('body').append(editView.render().$el);
			
	},
	handleLogout: function() {
		window.location = '/logout';
		/*
		jQuery.post('logout', function(data) {
			location.reload();
		});
		*/
	},
	render: function() {
		
	} 
});
