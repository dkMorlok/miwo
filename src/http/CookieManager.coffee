CookieSection = require './CookieSection'


class CookieManager

	document: null
	options: null


	constructor: (options = {}) ->
		@options = options
		@document = document
		return


	set: (key, value, options) ->
		@create(key, options).write(value)
		return this


	get: (key, def) ->
		return @create(key).read() || def


	remove: (key, options) ->
		@set(key, null, Object.merge({duration: -1}, options))
		return this


	create: (key, options) ->
		cookie = new Cookie(key, Object.merge({}, @options, options))
		cookie.options.document = @document
		return cookie


	section: (name, options) ->
		return new CookieSection(this, name, options)


module.exports = CookieManager