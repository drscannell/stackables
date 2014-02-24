

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
