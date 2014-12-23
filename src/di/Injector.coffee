Service = require './Service'
DiHelper = require './DiHelper'


class Injector

	params: null
	defines: null
	services: null
	globals: null

	constructor: (@params = {}) ->
		@defines = {}
		@services = {}
		@globals = {}
		@set('injector', this)
		if !@params.namespace then @params.namespace = 'App'


	define: (name, klass, cb = null) ->
		if @services[name] || @defines[name]
			throw new Error("Service #{name} already exists")
		service = new Service(this, name, klass, cb)
		@defines[name] = service
		return @defines[name]


	get: (name) ->
		if !@services[name] && !@defines[name]
			throw new Error("Service with name #{name} not found")
		if !@services[name] # must by defined
			@services[name] = @defines[name].create()
		return @services[name]


	update: (name) ->
		if !@defines[name]
			throw new Error("Service with name #{name} not found")
		return @defines[name]


	set: (name, service) ->
		if @services[name] || @defines[name]
			throw new Error("Service #{name} already exists")
		@services[name] = service
		return this


	has: (name) ->
		return @services[name] || @defines[name]


	setGlobal: (name, service) ->
		@globals[name] = service
		return this


	isDefined: (name) ->
		return @defines[name] isnt undefined


	create: (name) ->
		if !@defines[name]
			throw new Error("Service with name #{name} not defined")
		return @defines[name].create()


	createInstance: (klass, options = {}, factory = null) ->
		# evaluate options
		for name,value of options
			options[name] = DiHelper.evaluateArgs(value, this)[0]

		# property/setter injection
		if klass.prototype.injects
			for propName,serviceName of klass.prototype.injects
				options[propName] = @get(serviceName)

		# create instance
		if factory
			if Type.isString(factory)
				factory = DiHelper.evaluateArgs(factory, this)[0]
			if Type.isFunction(factory)
				instance = factory(options)
		else
			instance = new klass(options)

		# validate instance
		if instance !instanceof klass
			throw new Error("Created service is not instance of desired type #{klass.name}, but instance of #{instance.constructor.name}")

		# return instance
		return instance



module.exports = Injector