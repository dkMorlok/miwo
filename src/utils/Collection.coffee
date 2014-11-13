class Collection

	constructor: (object = null) ->
		@items = {}
		@length = 0
		if object
			if object instanceof Collection
				for key of object.items
					@items[key] = object.items[key]
			else
				for key of object
					@items[key] = object[key]


	each: (cb) ->
		Object.each(@items, cb)
		return


	filter: (cb) ->
		return Object.filter(@items, cb)


	find: (cb) ->
		return Object.some(@items, cb)


	set: (name, value) ->
		if !@has(name) then @length++
		@items[name] = value
		return


	get: (name, def = null) ->
		return if @has(name) then @items[name] else def


	getBy: (name, value) ->
		for item in @items
			if item[name] is value
				return item
		return null


	has: (name) ->
		return @items[name] isnt undefined


	remove: (name) ->
		if @items[name]
			delete @items[name]
			@length--
		return


	empty: ->
		@items = {}
		@length = 0
		return


	getFirst: ->
		for key,item of @items
			return item
		return null


	getLast: ->
		last = null
		for key,item of @items
			last = item
			continue
		return last


	keyOf: (value) ->
		return Object.keyOf(@items, value)


	indexOf: (find) ->
		index = 0
		for key,item of @items
			if item is find then return index
			index++
		return -1


	getAt: (at) ->
		index = 0
		for key,item of @items
			if index is at then return item
			index++
		return null


	getKeys: ->
		return Object.keys(@items)


	getValues: ->
		return Object.values(@items)


	toArray: ->
		array = []
		for key,item of @items
			array.push(item)
		return array


	destroy: ->
		for key,item of @items
			if item.destroy then item.destroy()
			delete @items[key]
		return


module.exports = Collection