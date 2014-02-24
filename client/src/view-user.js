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
