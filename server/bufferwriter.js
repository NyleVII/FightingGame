module.exports = {
	string: function(buffer, string)
	{
		if(string !== undefined)
			for(let i = 0; i < string.length; ++i)
				buffer.push(string.charCodeAt(i) & 0xff);
		
		buffer.push(0x00);
	}
};