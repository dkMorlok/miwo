Configurator = require './Configurator'


class Miwo

	@service: (name, service) ->
		Object.defineProperty @prototype, name,
			configurable: yes
			get:() -> @service(service || name)
		return

	# @property {Element}
	body: null

	# @property {String}
	baseUrl: ''

	# @property {Miwo.http.RequestManager}
	http: @service 'http'

	# @property {Miwo.http.RequestManager}
	cookie: @service 'cookie'

	# @property {Miwo.app.FlashNotificator}
	flash: @service 'flash'

	# @property {Miwo.component.ZIndexManager}
	zIndexMgr: @service 'zIndexMgr'

	# @property {Miwo.data.StoreManager}
	storeMgr: @service 'storeMgr'

	# @property {Miwo.data.ProxyManager}
	proxyMgr: @service 'proxyMgr'

	# @property {Miwo.data.EntityManager}
	entityMgr: @service 'entityMgr'

	# @property {Miwo.component.ComponentManager}
	componentMgr: @service 'componentMgr'

	# @property {Miwo.component.ComponentSelector}
	componentSelector: @service 'componentSelector'

	# @property {Miwo.window.WindowManager}
	windowMgr: @service 'windowMgr'

	# @property {Miwo.app.Application}
	application: @service 'application'

	# @property {Miwo.locale.Translator}
	translator: @service 'translator'

	# @property {Miwo.di.Injector}
	injector: null

	# @property Object
	extensions: null


	constructor: ->
		@ready () => @body = document.getElementsByTagName('body')[0];
		@extensions = {}


	# Register ready callback
	# @param {Function}
	ready: (callback) ->
		window.on('domready', callback)
		return

	# Translate key by translator
	# @param {String} key
	tr: (key) ->
		return @translator.get(key)


	# Require file by ajax and evaluate it
	# @param {String} file
	require: (file) ->
		data = miwo.http.read(file+"?t="+(new Date().getTime()))
		try
			eval(data)
		catch e
			throw new Error("Cant require file #{file}, data are not evaluable. Reason #{e.getMessage()}")
		return


	# Get component by id
	# @param {String}
	# @return {Miwo.component.Component}
	get: (id) ->
		return @componentMgr.get(id)


	# Select one component
	# @param {String}
	# @return {Miwo.component.Component}
	select: (selector) ->
		return @componentSelector.select(selector)


	# Select components
	# @param {String}
	# @return {[Miwo.component.Component]}
	selectAll: (selector) ->
		return @componentSelector.selectAll(selector)


	# Get service from injector
	# @param {String} name
	# @returns {Object}
	service: (name) ->
		return @injector.get(name)


	# Get store
	# @param {String} name
	# @returns {Miwo.data.Store}
	store: (name) ->
		return @storeMgr.get(name)


	# Get store
	# @param {String} name
	# @returns {Miwo.data.Store}
	proxy: (name) ->
		return @proxyMgr.get(name)


	# Register DI extension class
	# @param {String} name Unique name of extension
	# @param {Miwo.di.InjectorExtension} extension Extension class
	registerExtension: (name, extension) ->
		@extensions[name] = extension
		return


	# Creates default configurator
	# @returns {Miwo.bootstrap.Configurator}
	createConfigurator: () ->
		configurator = new Configurator(this)
		for name,extension of @extensions
			configurator.setExtension(name, new extension())
		return configurator


	# Set injector (called by Configurator)
	# @param {Miwo.di.Injector}
	setInjector: (@injector) ->
		@baseUrl = injector.params.baseUrl
		for name, service of injector.globals
			Miwo.service(name, service) # create service getter
		return


	init: (onInit)->
		configurator = @createConfigurator()
		onInit(configurator) if onInit
		injector = configurator.createInjector()
		return injector


# global object
module.exports = new Miwo