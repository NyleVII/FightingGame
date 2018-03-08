function DataReader(dataview)
{
	this.dataview = dataview;
	this.index = 0;
}

DataReader.prototype.read_string = function()
{
	let char, string = "";
	
	while(this.index < this.dataview.byteLength && (char = this.dataview.getInt8(this.index++)))
		string += String.fromCharCode(char);
	
	return string;
};

DataReader.prototype.read_int8 = function()
{
	if(this.index < this.dataview.byteLength)
		return this.dataview.getInt8(this.index++);
	return 0;
};