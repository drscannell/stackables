module.exports = {
	'url':process.env.STACKABLES_MONGO_URI || process.env.LOCAL_MONGO_URI || process.env.MONGOLAB_URI || null
};

