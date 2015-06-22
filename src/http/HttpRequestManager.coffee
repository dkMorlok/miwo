MiwoObject = require '../core/Object'
HttpRequest = require './HttpRequest'


class HttpRequestManager extends MiwoObject

	# @property {Object} persistent params
	params: null

	# @property {Array} registered plugins
	plugins: null

	# @event success (req, payload)
	# @event failure (req)
	# @event error (req, err)


	constructor: ->
		super()
		@params = {}
		@plugins = []
		@on 'request', (req) =>
			for plugin in @plugins
				plugin.request(req) if plugin.request
			return
		@on 'success', (req, payload) =>
			for plugin in @plugins
				plugin.success(req, payload) if plugin.success
			return
		@on 'failure', (req) =>
			for plugin in @plugins
				plugin.failure(req) if plugin.failure
			return
		@on 'error', (req) =>
			for plugin in @plugins
				plugin.error(req) if plugin.error
			return
		return


	###
		Register plugin
		@param plugin {Object} plugin
	###
	plugin: (plugin) ->
		@plugins.push(plugin)
		return


	###
		Create managed request
		@param options {Object}
		@return {Miwo.http.HttpRequest}
	###
	createRequest: (options) ->
		request = new HttpRequest(options)
		@manage(request)
		return request


	get: (options) ->
		request = @createRequest(options)
		request.get()
		return request


	post: (options) ->
		request = @createRequest(options)
		request.post()
		return request


	read: (url) ->
		data = null
		request = new Request
			url: url
			async: false
			onSuccess: (response) -> data = response
			onFailure: (xhr) -> data = null
		request.send()
		return data


	manage: (req) ->
		if !req.manager
			req.manager = this
			req.on "request", => @emit("request", req)
			req.on "success", (payload) => @emit("success", req, payload)
			req.on "failure", => @emit("failure", req)
			req.on "error", (err) => @emit("error", req, err)
		return


module.exports = HttpRequestManager