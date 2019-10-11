/* exported DOM */

const DOM = {
	hasclass: function(ele, cls)
	{
		return !!ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
	},

	addclass: function(ele, cls)
	{
		if(!ele.className.length)
			ele.className = cls;
		else if(!DOM.hasclass(ele, cls))
			ele.className += " " + cls;
	},

	removeclass: function(ele, cls)
	{
		ele.className = ele.className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)"), " ").trim();
	}
};