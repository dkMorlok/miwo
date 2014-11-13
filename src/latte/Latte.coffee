class Latte

	source: null
	compiled: null
	filters: null
	compiler: null


	constructor: (@compiler) ->
		@filters = {}


	setFilter: (name, filter) ->
		@filters[name] = filter
		return


	setSource: (@source) ->
		return


	render: (params) ->
		if !@compiled
			try
				@compiled = @compiler.compile(this, @source)
			catch e
				console.error("Latte compile error:", e.stack, " in compiling template:\n\n", @source)
				@compiled = null

		if @compiled
			return @evaluate(@compiled, params)
		else
			return 'LATTE_ERROR'


	evaluate: (string, params) ->
		try
			_tpl = ''
			filters = @filters
			template = this
			# eval params
			eval('var '+name+' = params["'+name+'"];')  for name of params
			# eval code
			return eval(string) || _tpl
		catch e
			console.error("Latte render error:", e.stack, " in template:\n\n", string)
			return ''





module.exports = Latte