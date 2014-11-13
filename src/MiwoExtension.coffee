InjectorExtension = require './di/InjectorExtension'
# app module
Application = require './app/Application'
Router = require './app/Router'
RequestFactory = require './app/RequestFactory'
FlashNotificator = require './app/FlashNotificator'
# template module
ControllerFactory = require './app/ControllerFactory'
TemplateFactory = require './templates/TemplateFactory'
TemplateLoader = require './templates/TemplateLoader'
# latte module
LatteFactory = require './latte/LatteFactory'
LatteCompiler = require './latte/LatteCompiler'
# http module
RequestManager = require './http/RequestManager'
CookieManager = require './http/CookieManager'
# component module
ComponentManager = require './component/ComponentManager'
ComponentSelector = require './component/ComponentSelector'
ZIndexManager = require './component/ZIndexManager'
# data module
StoreManager = require './data/StoreManager'
ProxyManager = require './data/ProxyManager'
EntityManager = require './data/EntityManager'


class MiwoExtension extends InjectorExtension


	init: ->
		@setConfig
			app: {
				namespace: 'App'
				flash: null
				controllers: {}
				run: []
			}
			templates: {
				baseUrl: '<%baseUrl%>'
				dir: '/dist/templates'
			}
			http: {
				params: {}
				plugins: {
					redirect: require('./http/plugins').RedirectPlugin
					failure: require('./http/plugins').FailurePlugin
					error: require('./http/plugins').ErrorPlugin
				}
			},
			cookie: {
				document: null
			},
			data: {
				stores: {}
				entities: {}
			},
			latte: {
				macros: {
					core: require './latte/CoreMacroSet'
					component: require './latte/ComponentMacroSet'
				}
			},
			di: {
				services: {}
			}
		return


	build: (injector) ->
		namespace = window[@config.app.namespace]
		if !namespace
			namespace = {}
			window[@config.app.namespace] = namespace

		if !namespace.entity then namespace.entity = {}
		if !namespace.store then namespace.store = {}
		if !namespace.components then namespace.components = {}
		if !namespace.controllers then namespace.controllers = {}


		# setup di
		for name,service of @config.di.services
			injector.setGlobal(name,service)


		# setup application
		injector.define 'application', Application, (service) =>
			service.runControllers = @config.app.run
		injector.define 'flash', FlashNotificator, (service)=>
			service.renderer = @config.app.flash
		injector.define 'miwo.controllerFactory', ControllerFactory, (service)=>
			service.namespace = @config.app.namespace
			for name,controller of @config.app.controllers
				service.register(name,controller)
			return
		injector.define 'miwo.router', Router
		injector.define 'miwo.requestFactory', RequestFactory


		# setup templating
		injector.define 'templateFactory', TemplateFactory, (service)=>
			return
		injector.define 'templateLoader', TemplateLoader, (service)=>
			service.baseUrl = @config.templates.baseUrl
			service.templatesDir = @config.templates.dir
			return


		# setup latte
		injector.define 'latteFactory', LatteFactory, (service)=>
			return
		injector.define 'latteCompiler', LatteCompiler, (service)=>
			for name,macroSetClass of @config.latte.macros
				macroSet = new macroSetClass()
				macroSet.install(service)
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


		# setup data
		injector.define 'storeMgr', StoreManager, (service)=>
			for name, store of @config.data.stores
				service.define(name, store)
				namespace.store[name.capitalize()] = store
		injector.define 'entityMgr', EntityManager, (service)=>
			for name, entity of @config.data.entities
				service.define(name, entity)
				namespace.entity[name.capitalize()] = entity
		injector.define 'proxyMgr', ProxyManager, (service)=>
			# setup proxies from entities
			for name, entity of @config.data.entities
				if entity.proxy
					service.define(name, entity.proxy)
					entity.proxy = name
		return



module.exports = MiwoExtension