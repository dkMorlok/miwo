Request = require './Request'
MiwoObject = require '../core/Object'


class Router extends MiwoObject

	controller: "default"
	action: "default"


	constructRequest: (hash) ->
		match = hash.match(/^(([a-zA-Z]*)(\:([a-z][a-zA-Z]+))?(\?(.*))?)?$/)
		controller = match[2] or @controller
		action = match[4] or @action
		params = (if match[6] then match[6].parseQueryString() else {})
		return new Request(controller, action, params)


	constructHash: (request) ->
		hash = request.controller
		if (request.action and request.action isnt @action) or (request.params and Object.getLength(request.params) > 0)
			hash += ":" + request.action
			if request.params
				query = Object.toQueryString(request.params)
				hash += "?" + query  if query
		return hash


module.exports = Router