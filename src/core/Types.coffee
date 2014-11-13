Type.extend

	###*
	  Returns true if the passed value is empty.
	  The value is deemed to be empty if it is
	  null
	  undefined
	  an empty array
	  a zero length string (Unless the allowBlank parameter is true)
	  @param {Mixed} v The value to test
	  @param {Boolean} allowBlank (optional) true to allow empty strings (defaults to false)
	  @return {Boolean}
	###
	isEmpty: (v, allowBlank) ->
		v is null or v is `undefined` or (Type.isArray(v) and not v.length) or ((if not allowBlank then v is "" else false))


	###*
	  Returns true if the passed value is a JavaScript array, otherwise false.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isArray: (v) ->
		Object::toString.call(v) is "[object Array]"


	###*
	  Returns true if the passed object is a JavaScript date object, otherwise false.
	  @param {Object} v The object to test
	  @return {Boolean}
	###
	isDate: (v) ->
		Object::toString.call(v) is "[object Date]"


	###*
	  Returns true if the passed value is a JavaScript Object, otherwise false.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isObject: (v) ->
		!!v and Object::toString.call(v) is "[object Object]"


	###*
	  Returns true if the passed value is a JavaScript 'primitive', a string, number or boolean.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isPrimitive: (v) ->
		Type.isString(v) or Type.isNumber(v) or Type.isBoolean(v)


	###*
	  Returns true if the passed value is a number.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isNumber: (v) ->
		typeof v is "number"


	###*
	  Returns true if the passed value is a integer
	  @param {Mixed} n The value to test
	  @return {Boolean}
	###
	isInteger: (n) ->
		Type.isNumber(n) and (n % 1 is 0)


	###*
	  Returns true if the passed value is a float
	  @param {Mixed} n The value to test
	  @return {Boolean}
	###
	isFloat: (n) ->
		Type.isNumber(n) and (/\./.test(n.toString()))


	###*
	  Returns true if the passed value is a string.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isString: (v) ->
		typeof v is "string"


	###*
	  Returns true if the passed value is a boolean.
	  @param {Mixed} v The value to test
	  @return {Boolean}
	###
	isBoolean: (v) ->
		typeof v is "boolean"


	###*
	  Returns tree if node is iterable
	  @return {Boolean}
	###
	isIterable: (j) ->
		i = typeof j
		k = false
		if j and i isnt "string"
			if i is "function"
				k = j instanceof NodeList or j instanceof HTMLCollection
			else
				k = true
		(if k then j.length isnt `undefined` else false)


	###*
	  Returns true if the passed value is a function.
	  @param {Mixed} f The value to test
	  @return {Boolean}
	###
	isFucntion: (f) ->
		typeof f is "function"


	isInstance: (o) ->
		return @isObject(o) && o.constructor.name != 'Object'


Object.expand = (original, args...) ->
	for obj in args
		if !obj then continue;
		for key,val of obj
			if original[key] is undefined || original[key] is null
				original[key] = obj[key]
	return original


Array.implement({

	insert: (index, item) ->
		@splice(index, 0, item)
		return

	destroy: () ->
		for item in this then if item.destroy then item.destroy()
		return

});


###*
script: array-sortby.js
version: 1.3.0
description: Array.sortBy is a prototype function to sort arrays of objects by a given key.
license: MIT-style
download: http://mootools.net/forge/p/array_sortby
source: http://github.com/eneko/Array.sortBy
###
(->
	keyPaths = []
	saveKeyPath = (path) ->
		keyPaths.push
			sign: (if (path[0] is "+" or path[0] is "-") then parseInt(path.shift() + 1, 0) else 1)
			path: path
		return


	valueOf = (object, path) ->
		ptr = object
		for p in path then ptr = ptr[p]
		return ptr


	comparer = (a, b) ->
		for item in keyPaths
			aVal = valueOf(a, item.path)
			bVal = valueOf(b, item.path)
			if aVal > bVal then return item.sign
			if aVal < bVal then return -item.sign
		return

	Array.implement "sortBy", (args...)->
		keyPaths.empty()
		for arg in args
			if typeOf(arg) is 'array'
				saveKeyPath(arg)
			else
				saveKeyPath(arg.match(/[+-]|[^.]+/g))
		return @sort(comparer)

	return
)()