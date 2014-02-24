/*
 * @class AppView
 * @extends Backbone.View
 */
var AppView = Backbone.View.extend({
	el: $('#app'),
	initialize: function(options) {
		this.stackViews = [];
		this.userModel = new User();
		this.userModel.fetch();
		this.notesCollection = options.notesCollection;
		this.stacksCollection = options.stacksCollection;
		this.listenTo(this.notesCollection, 'add', this.addNoteView);
		this.listenTo(this.stacksCollection, 'add', this.addStackDropdownView);
		this.listenTo(this.stacksCollection, 'change', this.refreshStackDropdownView);
		this.listenTo(this.userModel, 'change', this.userChange);
		this.isShowingArchive = false;
	},
	events: {
		'click input.js-add-note': 'addNewNote',
		'click input.js-add-stack': 'addNewStack',
		'click input.js-logout': 'logout',
		'click input.js-settings': 'showSettingsView',
		'change select.js-stack-select': 'showStack'
	},
	showStack: function(event) {
		event.stopPropagation();
		$('#notes').empty();
		var stackId = $(event.currentTarget).val();
		this.isShowingArchive = (stackId == 'archived');
		this.notesCollection = new NoteList([], {'stackId':stackId});
		this.listenTo(this.notesCollection, 'add', this.addNoteView);
	},
	addNewNote: function() {
		var note = new Note();
		var view = new NoteEditView({
			'isNew':true,
			'model':note,
			'stacksCollection':this.stacksCollection,
			'notesCollection':this.notesCollection
		});
		$('body').append(view.render().$el);
	},
	addNewStack: function() {
		console.log('add new stack');
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
	addStackDropdownView: function(stack) {
		console.log('add stack dropdown view');
		if (stack.getDeleted() == false) {
			var view = new StackDropdownView({'model':stack});
			$('.js-stack-select').append(view.render().$el);
			this.stackViews.push(view);
		}
	},
	refreshStackDropdownView: function(stack) {
		console.log('refresh stack dropdown view');
		var _this = this;
		$('.js-stack-select').empty();
		this.stacksCollection.each(function(stack) {
			_this.addStackDropdownView(stack);
		});
	},
	showSettingsView: function(){
		var editView = new UserEditView({
			'model':this.userModel,
			'stacksCollection':this.stacksCollection
		});
		$('body').append(editView.render().$el);
			
	},
	logout: function() {
		jQuery.post('logout', function(data) {
			location.reload();
		});
	},
	render: function() {
		
	} 
});
