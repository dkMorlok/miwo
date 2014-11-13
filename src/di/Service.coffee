DiHelper = require './DiHelper'


class Service

	injector: null
	name: null
	klass: null
	setups: null
	options: null
	factory: null
	global: false


	constructor: (@injector, @name, @klass, onCreate = null) ->
		@setups = []
		@options = {}
		@setups.push(onCreate) if onCreate


	create: ->
		instance = @injector.createInstance(@klass, @options, @factory)
		for setup in @setups
			setup(instance, @injector)
		return instance


	setClass: (@klass) ->
		return this


	setFactory: (@factory) ->
		return this


	setGlobal: (name) ->
		@injector.setGlobal(name||@name, @name)
		return this


	setup: (config) ->
		if Type.isFunction(config)
			@setups.push(config)
		else if Type.isArray(config)
			@setups.push(@createSetup(config))
		else
			@setups.push(@createSetup(Array.from(arguments)))
		return this


	option: (name, value) ->
		if Type.isString(name)
			if value isnt undefined
				@options[name] = value
			else
				delete @options[name]
		else if Type.isObject(name)
			for k,v of name
				@option(k,v)
		return this


	createSetup: (config) ->
		return (service, injector) =>
			for value in config
				DiHelper.evaluateCode(service, value, injector)
			return



module.exports = Service