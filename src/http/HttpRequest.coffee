class HttpRequest extends Request

	manager: null


	constructor: (options = {}) ->
		super(Object.merge(options, {data: {}}))
		@initRequest()


	initRequest: ->
		@setHeader "Accept", "application/json"
		@setHeader "X-Request", "JSON"
		return


	success: (text) ->
		json = @processJson(text)
		if !json
			@onFailure(null, text)
		else
			@onSuccess(json, text)
		return


	failure: ->
		json = @processJson(@response.text)
		@onFailure(json, @response.text)
		return


	processJson: (text) ->
		try
			json = JSON.decode(text, @options.secure)
			@response.json = json
			return json
		catch error
			@emit("error", text, error)
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
