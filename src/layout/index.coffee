module.exports =

	Absolute: require('./Absolute')
	Form: require('./Form')
	Fit: require('./Fit')
	Auto: require('./Auto')
	Layout: require('./Layout')

	createLayout: (type) ->
		return new this[type.capitalize()]()