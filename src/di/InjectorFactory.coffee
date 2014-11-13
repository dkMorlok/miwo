Injector = require './Injector'
DiHelper = require './DiHelper'


class InjectorFactory

	config: null
	extensions: null


	constructor: () ->
		@config =
			params:
				baseUrl: ''
		@extensions = {}


	setExtension: (name, extension) ->
		@extensions[name] = extension
		return


	setConfig: (config) ->
		Object.merge(@config, config)
		return


	createInjector: () ->
		injector = new Injector(@config.params)
		DiHelper.expand(injector.params, injector)

		for name,extension of @config.extensions
			@setExtension(name, new extension())

		for name,ext of @extensions
			ext.injector = injector
			ext.init()

		for name,ext of @extensions
			ext.setConfig(@config[name], injector) if @config[name]

		for name,ext of @extensions
			ext.build(injector)  if ext.build

		if @config.services then for name,service of @config.services
			if !injector.isDefined(name)
				definition = injector.define(name, service.type)
			else
				definition = injector.update(name)
			if service.factory
				definition.setFactory(service.factory)
			if service.setup
				definition.setup(service.setup)
			if service.options
				definition.option(service.options)

		for name,ext of @extensions
			ext.update(injector)  if ext.update

		return injector


module.exports = InjectorFactory