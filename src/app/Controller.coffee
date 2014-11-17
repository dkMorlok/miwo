MiwoObject = require '../core/Object'


class Controller extends MiwoObject

	injector: null
	application: null
	request: null


	@service: (prop, service = null) ->
		Object.defineProperty @prototype, prop,
			get: () -> @injector.get(service || prop)
		return


	# Internal initialization of controller
	# @protected
	startup: () ->
		return


	# Internal rendering notification
	# @protected
	beforeRender: () ->
		return


	# After render notification
	# @protected
	afterRender: () ->
		return


	# Control object or component
	# @param {Miwo.Object|String} target
	# @param {Object} events
	control: (target, events) ->
		@application.control(target, @boundEvents(events));
		return


	# Get main application viewport
	# @returns {Miwo.component.Container}
	getViewport: () ->
		return @application.getViewport();


	# Set system container
	# @param {Miwo.di.Injector} injector
	setInjector: (@injector) ->
		return


	# Bound control events to this scope
	# @private
	boundEvents: (events) ->
		for name,callback of events
			events[name] = @boundEvent(callback)
		return events


	# Bound control event to this scope
	# @private
	boundEvent: (callback) ->
		return (args...)=> if Type.isString(callback) then this[callback].apply(this, args) else callback.apply(this, args)


	# Forward request (executed without change hash)
	# @param {String} code
	# @param {Object} params
	forward: (code, params) ->
		@request.executed = true
		@application.forward(@createRequest(code, params))
		return


	# Redirect request (hash changed)
	# @param {String} code
	# @param {Object} params
	redirect: (code, params) ->
		@request.executed = true;
		@application.redirect(@createRequest(code, params))
		return


	# Create application request
	# @private
	createRequest: (code, params) ->
		return @injector.get('miwo.requestFactory').create code, params,
			name: @name
			action: @action


	# Execute application request
	# @protected
	# @param {Miwo.app.Request} reqest
	execute: (request) ->
		@request = request
		return


module.exports = Controller