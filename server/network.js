module.exports = {
	send: function(connection, bytes)
	{
		connection.sendBytes(Buffer.from(bytes));
	}
};