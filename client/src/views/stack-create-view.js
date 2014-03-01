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
