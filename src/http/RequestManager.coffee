MiwoObject = require '../core/Object'
HttpRequest = require './HttpRequest'

class RequestManager extends MiwoObject

	# @property {Object} persistent params
	params: {}

	# @property {Object} registered plugins
	plugins: {}

	# Create managed request
	# @param options {Object}
	# @return {Miwo.http.HttpRequest}
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
			onFailure: () -> throw new Error("Can't load data from url #{url}")
		request.send()
		return data


	manage: (request) ->
		if request.manager
			return
		request.manager = this
		request.on "success", (json) =>
			@emit("success", request, json)
			return
		request.on "failure", =>
			@emit("failure", request)
			return
		request.on "error", (text, error) =>
			@emit("error", request, text, error)
			return
		return


	# Register plugin
	# @param name {string} name of plugin
	# @param plugin {Object} plugin
	register: (name, plugin) ->
		if @plugins[name]
			throw new Error("Plugin with name #{name} already registered")
		@plugins[name] = plugin
		plugin.setManager(this)
		return


module.exports = RequestManager