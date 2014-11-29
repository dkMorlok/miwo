Controller = require './Controller'
MiwoObject = require '../core/Object'


class ControllerFactory extends MiwoObject

	injector: @inject('injector')
	namespace: 'App'
	controllers: null


	constructor: (config) ->
		super(config)
		@controllers = {}


	register: (name, klass) ->
		@controllers[name] = klass
		return this


	create: (name) ->
		klassName = @formatClassName(name)
		try
			klass = eval(klassName)
		catch e
			throw new Error("Controller class #{klassName} is bad defined")

		if typeof(klass) isnt 'function'
			throw new Error("Controller class #{klassName} is not constructor")

		controller = @injector.createInstance(klass)
		controller.setInjector(@injector)
		controller.name = name

		if controller !instanceof Controller
			throw new Error("Controller #{klassName} is not instance of Controller")

		return controller


	formatClassName: (name)->
		if @controllers[name]
			return @controllers[name]
		else
			return @namespace+'.controllers.'+name.capitalize()+'Controller'


module.exports = ControllerFactory