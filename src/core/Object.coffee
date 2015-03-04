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
		return if !config
		@set(k,v) for k, v of config
		return


	set: (name, value) ->
		@[name] = value if value isnt undefined
		return this


	destroy: ->
		if @isDestroyed then return
		@destroying = true
		if @beforeDestroy then @beforeDestroy()
		@_callDestroy()
		if @doDestroy then @doDestroy()
		@destroying = false
		@isDestroyed = true
		if @afterDestroy then @afterDestroy()
		return


	_callDestroy: ->
		for name,method of this
			if name.indexOf("_destroy") is 0
				method.call(this)
		return


	toString: ->
		return @constructor.name



MiwoObject.addMethod = (name, method) ->
	@prototype[name] = method
	return


module.exports = MiwoObject