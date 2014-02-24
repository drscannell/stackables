
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
