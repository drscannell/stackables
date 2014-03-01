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
	addNote: function(noteModel) {
		console.log('Stack.addNote');
		var noteId = noteModel.getId();
		var notes = this.get('notes')
		var index = notes.indexOf(noteId);
		if (index == -1) {
			notes.push(noteId);
		} 
	},
	removeNote: function(noteModel) {
		console.log('Stack.removeNote');
		var noteId = noteModel.getId();
		var notes = this.get('notes')
		var index = notes.indexOf(noteId);
		if (index != -1) {
			notes.splice(index, 1);
		}
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
