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
