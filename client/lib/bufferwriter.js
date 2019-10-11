/* exported BufferWriter */

const BufferWriter = {
	string: function(buffer, string)
	{
		// TODO(shawn): support utf encoding
		if(string !== undefined)
			for(let index_character = 0; index_character < string.length; ++index_character)
				buffer.push(string.charCodeAt(index_character) & 0xff);
		
		buffer.push(0x00);
	}
};