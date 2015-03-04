InjectorExtension = require './di/InjectorExtension'

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