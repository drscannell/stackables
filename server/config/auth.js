module.exports = {
	'facebookAuth' : {
		'clientID': process.env.AUTH_TEST_FACEBOOK_ID,
		'clientSecret': process.env.AUTH_TEST_FACEBOOK_SECRET,
		'callbackURL': 'http://localhost:8080/auth/facebook/callback'
	},
	'twitterAuth' : {
		'consumerKey': process.env.AUTH_TEST_TWITTER_KEY,
		'consumerSecret': process.env.AUTH_TEST_TWITTER_SECRET,
		'callbackURL': 'http://localhost:8080/auth/twitter/callback'
	},
	'googleAuth' : {
		'clientID': process.env.STACKABLES_GOOGLE_ID,
		'clientSecret': process.env.STACKABLES_GOOGLE_SECRET,
		'callbackURL': process.env.STACKABLES_GOOGLE_CALLBACK || 'http://localhost:8080/auth/google/callback'
	}
}
