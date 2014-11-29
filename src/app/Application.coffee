MiwoObject = require '../core/Object'
EventManager = require './EventManager'


class Application extends MiwoObject

	@inject 'injector'
	@inject 'controllerFactory', 'miwo.controllerFactory'

	eventMgr: null
	componentMgr: null
	viewport: null
	rendered: false
	controllers: null
	runControllers: null
	autoCanonicalize: true


	constructor: (config) ->
		@controllers = {}
		@eventMgr = new EventManager()
		super(config)
		return


	setInjector: (@injector) ->
		if !injector.has('viewport')
			throw new Error("Missing 'viewport' service. Viewport is required to render your application")
		return


	run: (render = null) ->
		# startup controllers
		for name in @runControllers
			@getController(name).startup()

		# auto render viewport
		if render then @render(render)
		return


	render: (target = null) ->
		if !@rendered
			@rendered = true
			viewport = @getViewport()

			# notify beforeRender
			for name,controller of @controllers
				controller.beforeRender()

			# render viewport
			viewport.render(target || miwo.body)

			# notify afterRender
			for name,controller of @controllers
				controller.afterRender()

			# handle hash changes
			window.onhashchange = @executeRequestByHash.bind(this)
			@executeRequestByHash()
		return


	getController: (name) ->
		if !@controllers[name]
			@controllers[name] = @controllerFactory.create(name)
			@controllers[name].application = this
		return @controllers[name]


	control: (target, events) ->
		if Type.isString(target)
			@eventMgr.control(target, events)
		else
			target.on(events)
		return


	getViewport: () ->
		return @injector.get('viewport')


	getRouter: () ->
		return @injector.get('miwo.router')


	execute: (request) ->
		@getController(request.controller).execute(request)
		return


	forward: (request) ->
		setTimeout((() => @execute(request)), 1)
		return


	redirect: (request) ->
		document.location.hash = @getRouter().constructHash(request)
		return


	executeRequestByHash: ->
		hash = document.location.hash.substr(1).toLowerCase()
		request = @getRouter().constructRequest(hash)
		constructedHash = @getRouter().constructHash(request)

		if @autoCanonicalize and constructedHash isnt hash
			document.location.hash = constructedHash
			return

		@execute(request)
		return


module.exports = Application