const Crypto = require("crypto");

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const NORM_UINT32 = 2.3283064365386963e-10;

const Random = module.exports = {
	fraction: function()
	{
		return Crypto.randomBytes(4).readUInt32LE(0)*NORM_UINT32;
	},
	
	shuffle: function(list)
	{
		for(let i = list.length; i; --i)
		{
			const j = Math.floor(Random.fraction()*i);
			const temp = list[i - 1];
			list[i - 1] = list[j];
			list[j] = temp;
		}
	},
	
	identifier: function(length)
	{
		let identifier = "";
		for(let i = 0; i < length; ++i)
			identifier += ALPHABET.charAt(Math.floor(Random.fraction()*ALPHABET.length));
		
		return identifier;
	}
};