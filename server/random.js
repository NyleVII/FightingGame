const Crypto = require("crypto");

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const NORM_UINT32 = 2.3283064365386963e-10;

module.exports = {
	fraction: function()
	{
		return Crypto.randomBytes(4).readUInt32LE(0)*NORM_UINT32;
	},

	shuffle: function(list)
	{
		for(let index_element = list.length; index_element; --index_element)
		{
			const j = Math.floor(this.fraction()*index_element);
			const temp = list[index_element - 1];
			list[index_element - 1] = list[j];
			list[j] = temp;
		}
	},

	identifier: function(length)
	{
		let identifier = "";
		for(let index_character = 0; index_character < length; ++index_character)
			identifier += ALPHABET.charAt(Math.floor(this.fraction()*ALPHABET.length));

		return identifier;
	}
};
