MiwoObject = require '../core/Object'


class EventManager extends MiwoObject

	selectors: null


	constructor: () ->
		super()
		@selectors = []
		miwo.componentMgr.on("register", @bound("onRegister"))
		miwo.componentMgr.on("unregister", @bound("onUnregister"))
		return


	control: (selector, events) ->
		@selectors.push({selector: selector, events: events})
		return


	onRegister: (component) ->
		for item in @selectors
			if component.is(item.selector)
				for name,event of item.events
					component.on(name, event)
		return


	onUnregister: (component) ->
		for item in @selectors
			if component.is(item.selector)
				for name,event of item.events
					component.un(name, event)
		return


	doDestroy: ->
		miwo.componentMgr.un("register", @bound("onRegister"))
		miwo.componentMgr.un("unregister", @bound("onUnregister"))
		return


module.exports = EventManager