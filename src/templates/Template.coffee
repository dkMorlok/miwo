class Template

	loader: null
	renderer: null
	params: null
	target: null


	constructor: (@renderer) ->
		@params = {}


	setTarget: (@target) ->
		return


	set: (key, value) ->
		if Type.isObject(key)
			@params[k] = v  for k,v of key
		else
			@params[key] = value;
		return this


	get: (key) ->
		return @params[key]


	setLoader: (@loader) ->
		return


	setFilter: (name, filter) ->
		@renderer.setFilter(name, filter)
		return this


	setFilters: (filters) ->
		for name,filter of filters
			@renderer.setFilter(name, filter)
		return this


	setSource: (config) ->
		@renderer.setSource(@loader.load(config))
		return this


	render: (params) ->
		data = {}
		data[name] = value  for name,value of @params
		data[name] = value  for name,value of params
		@target.set('html', @renderer.render(data))
		return


module.exports = Template