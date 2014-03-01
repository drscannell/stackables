var StackMembershipView = ControllerView.extend({
	/** @class StackMembershipView
	 * @author drscannell
	 * @augments ControllerView
	 * @constructs StackMembershipView object */

	tagName: 'option',
	className: 'stack',
	initialize: function(options) {
		this.listenTo(this.model, 'change', this.handleModelChange);
	},
	setChecked: function(shouldCheck) {
		this.options.isChecked = shouldCheck;
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
