class CookieSection

	cookie: null
	name: null
	options: null
	items: null


	constructor: (cookie, name, options) ->
		@cookie = cookie
		@name = name
		@options = options
		@items = JSON.decode(cookie.get(name) or "{}", true)
		return


	save: ->
		value = JSON.encode(@items)
		if not value or value.length > 4096
			return false #cookie would be truncated!
		else
			if value is "{}"
				@cookie.remove(@name)
			else
				@cookie.set(@name, value, @options)
			return true


	set: (name, value) ->
		if value is null
			delete @items[name]
		else
			@items[name] = value
		return this


	get: (name, def) ->
		return (if @items[name] isnt undefined then @items[name] else def)


	has: (name) ->
		return @items[name] isnt undefined


	each: (callback) ->
		Object.each(@items, callback)
		return


module.exports = CookieSection