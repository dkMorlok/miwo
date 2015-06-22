class HttpRequest extends Request

	manager: null


	constructor: (options = {}) ->
		options.type = options.type || 'json'
		super(Object.merge(options, {data: {}}))
		@init()
		return


	init: ->
		if @options.type is 'json'
			@setHeader('Accept', 'application/json')
			@setHeader('X-Request', 'JSON')
		return


	success: (text) ->
		if @options.type is 'json'
			try
				json = JSON.decode(text, @options.secure)
				@response.json = json
			catch err
				@emit("error", err, text, this.xhr)
				@onFailure()
				return
			@onSuccess(json, text)
		else
			@onSuccess(text)
		return


	send: (options = {}) ->
		if @manager
			options.data = Object.merge({}, @manager.params, options.data || @options.data)
			super(options)
		else
			options.data = Object.merge({}, options.data or @options.data)
			super(options)
		return


module.exports = HttpRequest