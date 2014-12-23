InjectorExtension = require './di/InjectorExtension'

# app module
Application = require './app/Application'
Router = require './app/Router'
RequestFactory = require './app/RequestFactory'
FlashNotificator = require './app/FlashNotificator'
ControllerFactory = require './app/ControllerFactory'

# http module
RequestManager = require './http/RequestManager'
CookieManager = require './http/CookieManager'

# component module
ComponentManager = require './component/ComponentManager'
ComponentSelector = require './component/ComponentSelector'
ZIndexManager = require './component/ZIndexManager'

# locale
Translator = require './locale/Translator'


class MiwoExtension extends InjectorExtension


	init: ->
		@setConfig
			app: {
				flash: null
				controllers: {}
				run: []
				defaultController: 'default'
				defaultAction: 'default'
				autoCanonicalize: true
			}
			http: {
				params: {}
				plugins: {
					redirect: require('./http/plugins').RedirectPlugin
					failure: require('./http/plugins').FailurePlugin
					error: require('./http/plugins').ErrorPlugin
				}
			}
			cookie: {
				document: null
			}
			di: {
				services: {}
			}
		return


	build: (injector) ->
		namespace = window[injector.params.namespace]
		if !namespace
			namespace = {}
			window[injector.params.namespace] = namespace

		if !namespace.components then namespace.components = {}
		if !namespace.controllers then namespace.controllers = {}


		# setup di
		for name,service of @config.di.services
			injector.setGlobal(name,service)


		# setup application
		injector.define 'application', Application, (service) =>
			service.runControllers = @config.app.run
			service.autoCanonicalize = @config.app.autoCanonicalize
		injector.define 'flash', FlashNotificator, (service)=>
			service.renderer = @config.app.flash
		injector.define 'miwo.controllerFactory', ControllerFactory, (service)=>
			service.namespace = @config.app.namespace
			for name,controller of @config.app.controllers
				service.register(name,controller)
			return
		injector.define 'miwo.router', Router, (service) =>
			service.controller = @config.app.defaultController
			service.action = @config.app.defaultAction
			return
		injector.define 'miwo.requestFactory', RequestFactory


		# setup locale
		injector.define 'translator', Translator, (service)=>
			return


		# setup http
		injector.define 'http', RequestManager, (service)=>
			service.params = @config.http.params
			for name,plugin of @config.http.plugins
				service.register(name, new plugin())
			return
		injector.define 'cookie', CookieManager, (service)=>
			if @config.cookie.document
				service.document = @config.cookie.document
			return


		# setup components
		injector.define 'componentMgr', ComponentManager
		injector.define 'componentSelector', ComponentSelector
		injector.define 'zIndexMgr', ZIndexManager
		return



module.exports = MiwoExtension