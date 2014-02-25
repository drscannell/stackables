/*
 * @class Note
 * @extends Backbone.Model
 */
var Note = Backbone.Model.extend({
	defaults: {
		'name':'Untitled Note',
		'markdown':'',
		'deleted':false
	},
	url: function(){
		return '/note?id=' + this.get('_id');
	},
	getId: function() {
		return this.get('_id');
	},
	getName: function() {
		return this.get('name');
	},
	setName: function(newName) {
		this.set('name', newName);
	},
	getBodyHTML: function() {
		try {
			var htmlText =  marked(this.getMarkdown());
			return htmlText;
		} catch (ex) {
			return 'Markdown parser error: ' + ex
		}
	},
	getMarkdown: function(markdown) {
		return this.get('markdown');
	},
	setMarkdown: function(markdown) {
		this.set('markdown', markdown);
	},
	getDeleted: function() {
		return this.get('deleted');
	},
	setDeleted: function() {
		if (this.getDeleted()) {
			this.set('deleted', false);
		} else {
			this.set('deleted', true);
		}
	}
});
/**
 * @class Stack
 * @extends Backbone.Model
 */
var Stack = Backbone.Model.extend({
	defaults: {
		'name':'Untitled Stack',
		'notes':[],
		'isDeleted':false
	},
	url: function(){
		return '/stack?id=' + this.get('_id');
	},
	getId: function() {
		return this.get('_id');
	},
	getName: function() {
		return this.get('name');
	},
	setName: function(name) {
		this.set('name', name);
	},
	getDeleted: function() {
		return this.get('isDeleted');
	},
	setDeleted: function(trueFalse) {
		this.set('isDeleted', trueFalse);
	},
	getNotes: function() {
		return this.get('notes');
	},
	setNotes: function(notes) {
		this.set('notes', notes);
	},
	toggleNoteMembership: function(noteModel) {
		console.log('Stack.toggleNoteMembership');
		var noteId = noteModel.getId();
		var notes = this.get('notes')
		var index = notes.indexOf(noteId);
		if (index == -1) {
			notes.push(noteId);
		} else {
			notes.splice(index, 1);
		}
	},
	hasNote: function(noteId) {
		var notes = this.get('notes')
		if (notes.indexOf(noteId) == -1) {
			return false;
		}
		return true;
	}
});

/*
 * @class User
 * @extends Backbone.Model
 */
var User = Backbone.Model.extend({
	url: '/user',
	getUsername: function() {
		return this.get('username');
	},
	setUsername: function(username) {
		this.set('username', username);
	},
	getEmail: function() {
		return this.get('email');
	},
	setEmail: function(email) {
		this.set('email',email);
	},
	getStacks: function() {
		return this.get('stacks');
	},
	addStack: function(stackModel) {
		var obj = {
			'stackId':stackModel.getId(),
			'name':stackModel.getName()
		};
		this.get('stacks').push(obj);
		
	}
});

/*
 * @class StackList
 * @extends Backbone.Collection
 */
var StackList = Backbone.Collection.extend({
	model: Stack,
	url: '/stacks',
	initialize: function(models, options) {
		this.fetch();
	}
});

/*
 * @class NoteList
 * @extends Backbone.Collection
 */
var NoteList = Backbone.Collection.extend({
	model: Note,
	url: function() {
		if (this.stackId) {
			return '/notes?stackId=' + this.stackId;
		} else {
			return '/notes';
		}
	},
	initialize: function(models, options) {
		this.stackId = null;
		if (options && 'stackId' in options) {
			this.stackId = options.stackId;
		}
		this.fetch();
	}
});
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


/*
 * @class StackDropdownView
 * @extends Backbone.View
 */
var StackDropdownView = Backbone.View.extend({
	tagName: 'option',
	className: 'stack',
	initialize: function(options) {
		this.listenTo(this.model, 'change', this.react);
	},
	toggleNoteMembership: function(noteModel) {
		console.log('StackDropdownView.toggleNoteMembership');
		this.model.toggleNoteMembership(noteModel);
		this.model.save(undefined, {
			'thisView':this,
			error:function(){
				console.log('failed to update stack');
			},
			success:function(model, response, options){
				console.log('successfully updated stack');
				options.thisView.render();
			}
		});
	},
	setChecked: function(shouldCheck) {
		this.options.isChecked = shouldCheck;
	},
	isSelected: function() {
		console.log('StackDropdownView.isSelected()');
		console.log(this.$el.get(0));
		return this.$el.attr('selected');
	},
	react: function() {
		if ( this.model.getDeleted() ) {
			this.remove();
		} else {
			this.render();
		}
	},
	render: function() {
		var name = this.model.getName();
		var display = name;
		if ('isChecked' in this.options && this.options.isChecked) {
			display = '+ ' + display;
		} else if ('isChecked' in this.options) {
			display = '- ' + display;
		}
		this.$el.attr('value', this.model.getId());
		this.$el.html(display);
		return this; 
	}
});


/*
 * @class StackManagerView
 * @extends Backbone.View
 */
var StackManagerView = Backbone.View.extend({
	tagName: 'li',
	className: 'stack-manager-list',
	initialize: function(options) {
		this.listenTo(this.model, 'change', this.render);
	},
	events: {
		'click input.js-archive': 'archive',
		'click input.js-unarchive': 'unarchive'
	},
	archive: function(event) {
		event.stopPropagation();
		this.model.setDeleted(true);
		this.save();
	},
	unarchive: function(event) {
		event.stopPropagation();
		this.model.setDeleted(false);
		this.save();
	},
	save: function() {
		this.model.save(undefined, {
			error:function(){
				console.log('failed to update stack');
			},
			success:function(model, response, options){
				console.log('successfully updated stack');
			}
		});
	},
	render: function() {
		var name = this.model.getName();
		var display = '';
		if (this.model.getDeleted()) {
			display += '<input type="button" ' +
				'class="small-button js-unarchive" ' +
				'value="unarchive" /> ';
		} else {
			display += '<input type="button" ' +
				'class="small-button js-archive" ' +
				'value="archive" /> ';
		}
		display += name;
		this.$el.html(display);
		return this; 
	}
});

/**
 * @class StackCreateView
 * @extends Backbone.View
 */
var StackCreateView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-view',
	template: Handlebars.compile( $('#create-stack-template').html() ),
	initialize: function(options) {
			this.userModel = options.userModel;
			this.stacksCollection = options.stacksCollection;
	},
	events: {
		'click input.close': 'saveAndClose',
		'click input.js-cancel': 'cancel'
	},
	cancel: function(event) {
		console.log('cancel');
		event.stopPropagation();
		$('#app').show();
		this.remove();
	},
	saveAndClose: function(event) {
		console.log('save and close');
		event.stopPropagation();
		var name = $('.js-stack-name', this.$el).first().val();
		var notes = [];
		this.model.setName(name);
		this.model.setNotes(notes);
		var _this = this;
		this.model.save(undefined, {
			userModel: this.options.userModel,
			error:function(){
				console.log('error');
			},
			success:function(model, response, options){
				console.log('successfully added stack');
				console.log('adding stack to user model');
				options.userModel.addStack(model);
				options.userModel.save();
				console.log('adding stack to stacks collection');
				_this.stacksCollection.add(model);
			}
		});
		$('#app').show();
		this.remove();
	},
	archive: function(event) {
		console.log('archive stack');
	},
	render: function() {
		$('#app').hide();
		var context = {
			'stackName': this.model.getName()
		};
		this.$el.html(this.template(context));
		return this; 
	}
});

/**
 * @class StackEditView
 * @extends Backbone.View
 */
var StackEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-view',
	template: Handlebars.compile( $('#edit-stack-template').html() ),
	initialize: function(options) {
			this.userModel = options.userModel;
			this.stacksCollection = options.stacksCollection;
	},
	events: {
		'click input.close': 'saveAndClose',
		'click input.delete': 'archive'
	},
	saveAndClose: function(event) {
		console.log('save and close');
		event.stopPropagation();
		var name = $('.js-stack-name', this.$el).first().val();
		var notes = [];
		this.model.setName(name);
		this.model.setNotes(notes);
		var _this = this;
		this.model.save(undefined, {
			userModel: this.options.userModel,
			error:function(){
				console.log('error');
			},
			success:function(model, response, options){
				console.log('successfully added stack');
				console.log('adding stack to user model');
				options.userModel.addStack(model);
				options.userModel.save();
				console.log('adding stack to stacks collection');
				_this.stacksCollection.add(model);
			}
		});
		$('#app').show();
		this.remove();
	},
	archive: function(event) {
		console.log('archive stack');
	},
	render: function() {
		$('#app').hide();
		var context = {
			'stackName': this.model.getName()
		};
		this.$el.html(this.template(context));
		return this; 
	}
});
/*
 * @class UserEditView 
 * @extends Backbone.View
 */
var UserEditView = Backbone.View.extend({
	tagName: 'div',
	className: 'edit-user-pane',
	template: Handlebars.compile( $('#edit-user-template').html() ),
	initialize: function(options) {
		this.stacksCollection = options.stacksCollection;
		this.listenTo(this.model, 'invalid', this.reportValidationErrors);
		console.log('getStacks()');
		console.log(this.model.getStacks());
	},
	events: {
		'click input.close': 'saveAndClose'
	},
	saveAndClose: function(event) {
		event.stopPropagation();
		this.updateModel();
		if (this.model.save()) {
			$('#app').show();
			this.remove();
		}
	},
	updateModel: function() {
		var email = $('.edit-email', this.$el).first().val();
		this.model.setEmail(email);
	},
	markAllInputsValid: function() {
		$('.js-input-container', this.$el)
			.removeClass('error')
			.addClass('success');
	},
	reportValidationErrors: function(model, errors) {
		$('.text-input', this.$el).removeClass('error').addClass('success');
		_.each(errors, function(error, i) {
			var query = '.' + error.class;
			$(query, this.$el).addClass('error');
		});
	},
	render: function() {
		$('#app').hide();
		var context = {
			'username':this.model.getUsername(), 
			'email':this.model.getEmail(),
			'stacksCollection':this.stacksCollection
		};
		this.$el.html(this.template(context));
		var _this = this;
		this.stacksCollection.each(function(stack) {
			view = new StackManagerView({
				'model': stack
			});
			$('.js-stack-manager-list', _this.$el).append(view.render().$el);
		});
		return this; 
	}
});
function main() {
	
	/*
	 * This app is mobile-first.
	 * If not touch screen, trigger
	 * desktop enhancements by adding
	 * class to the body
	 */
	if ( !('ontouchstart' in window) ) {
		$('body').addClass('not-mobile');
	}

	/*
	 * configure markdown parser
	 */
	marked.setOptions({
		gfm: true,
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: false,
		langPrefix: 'lang-'
	});

	/*
	 * instantiate
	 */
	var notes = new NoteList();
	var stacks = new StackList();
	var app = new AppView({
		'notesCollection':notes,
		'stacksCollection':stacks
	});
}

$(document).ready(main);
