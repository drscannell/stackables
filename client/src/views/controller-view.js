
var ControllerView = Backbone.View.extend({
	/** @class ControllerView
	 * @author dscannell
	 * @augments Backbone.View
	 * @constructs ControllerView object */

	saveModel: function(model, callback) {
		var _this = this;
		model.save(undefined,{
			error:function(model, xhr, options) {
				console.log(xhr);
				if (callback)
					callback('Failed to save model', false);
			},
			success:function(model, response, options){
				if (callback)
					callback(null, true);
			}
		});
	}

});
