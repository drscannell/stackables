/*
 * @class StackDropdownView
 * @extends Backbone.View
 */
var StackSelectorView = Backbone.View.extend({
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
