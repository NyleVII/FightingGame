/* eslint no-console: off */

module.exports = {
	message: function(message)
	{
		console.log(message);
	},

	error: function(error, context)
	{
		console.log("An error occurred while " + context);
		console.error(error);
	}
};
