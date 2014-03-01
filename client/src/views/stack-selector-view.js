/*
 * @class StackSelectorView
 * @extends Backbone.View
 */
var StackSelectorView = Backbone.View.extend({
	tagName: 'option',
	className: 'stack',
	initialize: function(options) {
		this.listenTo(this.model, 'change', this.handleModelChange);
	},
	handleModelChange: function() {
		if ( this.model.getDeleted() ) {
			this.remove();
		} else {
			this.render();
		}
	},
	render: function() {
		var name = this.model.getName();
		var display = name;
		this.$el.attr('value', this.model.getId());
		this.$el.html(display);
		return this; 
	}
});
