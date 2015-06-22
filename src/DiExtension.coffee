di = require './di'
http = require './http'
component = require './component'
utils = require './utils'


class MiwoExtension extends di.InjectorExtension


	init: ->
		@setConfig
			http:
				params: {}
				plugins:
					redirect: http.plugins.RedirectPlugin
					failure: http.plugins.FailurePlugin
					error: http.plugins.ErrorPlugin
			cookie:
				document: null
			di:
				services: {}
			flash:
				renderer: null
		return


	build: (injector) ->
		config = @config
		namespace = window[injector.params.namespace]
		if !namespace
			namespace = {}
			window[injector.params.namespace] = namespace

		if !namespace.components then namespace.components = {}
		if !namespace.controllers then namespace.controllers = {}


		# setup di
		for name,service of config.di.services
			injector.setGlobal(name,service)


		# setup http
		injector.define 'http', http.HttpRequestManager, (service) ->
			service.params = config.http.params
			for name,plugin of config.http.plugins
				service.plugin(new plugin()) if plugin
			return

		injector.define 'cookie', http.CookieManager, (service) ->
			if config.cookie.document
				service.document = config.cookie.document
			return


		# setup components
		injector.define 'componentMgr', component.ComponentManager

		injector.define 'componentStateMgr', component.StateManager

		injector.define 'componentStatePersister', component.StatePersister

		injector.define 'componentSelector', component.ComponentSelector

		injector.define 'zIndexMgr', component.ZIndexManager


		# setup utils
		injector.define 'flash', utils.FlashNotificator, (service) ->
			if config.flash.renderer
				service.renderer = config.flash.renderer
			return
		return



module.exports = MiwoExtension