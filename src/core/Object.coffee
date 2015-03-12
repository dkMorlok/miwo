Events = require './Events'


class MiwoObject extends Events

	isObject: true
	isDestroyed: false
	destroying: false


	constructor: (config) ->
		super()
		@setConfig(config)
		return


	setConfig: (config) ->
		if !config then return
		for k, v of config then @setProperty(k,v)
		return


	setProperty: (name, value) ->
		@[name] = value if value isnt undefined
		return this


	set: (name, value) ->
		@setProperty(name, value)
		return this


	destroy: ->
		if @isDestroyed then return
		@destroying = true
		@beforeDestroy()
		@_callDestroy()
		@doDestroy()
		@destroying = false
		@isDestroyed = true
		@afterDestroy()
		return


	_callDestroy: ->
		for name,method of this
			if name.indexOf("_destroy") is 0
				method.call(this)
		return


	toString: ->
		return @constructor.name


	beforeDestroy: ->
		@beforeDestroyCalled = true
		return


	doDestroy: ->
		@doDestroyCalled = true
		return


	afterDestroy: ->
		@afterDestroyCalled = true
		return



MiwoObject.addMethod = (name, method) ->
	@prototype[name] = method
	return


module.exports = MiwoObject