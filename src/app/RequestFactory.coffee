Request = require './Request'


class RequestFactory

	codeRe: /(([a-zA-Z]+)\:)?([a-z][a-zA-Z]+)/


	create: (code, params, defaults) ->
		parts = code.match(this.codeRe)
		if(!parts) then throw new Error("Bad redirect CODE")
		controller = if parts[2] isnt undefined then parts[2] else defaults.name
		action = if parts[3] isnt 'this' then defaults.action else parts[3]
		return new Request(controller, action, params)


module.exports = RequestFactory