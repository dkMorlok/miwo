InjectorFactory = require '../di/InjectorFactory'
MiwoExtension = require '../MiwoExtension'


class Configurator

	miwo: null
	injectorFactory: null


	constructor: (@miwo) ->
		@injectorFactory = new InjectorFactory()
		@injectorFactory.setExtension('miwo', new MiwoExtension())


	createInjector: () ->
		injector = @injectorFactory.createInjector()
		@miwo.setInjector(injector)
		return injector


	setExtension: (name, extension) ->
		@injectorFactory.setExtension(name, extension)
		return


	setConfig: (config) ->
		@injectorFactory.setConfig(config)
		return



module.exports = Configurator