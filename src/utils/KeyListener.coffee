class KeyListener

	target: null
	event: 'keyup'
	handlers: null
	handleEvent: null
	paused: true


	constructor: (target, event) ->
		@target = target
		@event = event if event
		@handlers = {}
		@handleEvent = (e)=>
			if @handlers[e.key]
				stopEvent = @handlers[e.key](e)
				if stopEvent then e.stop()
			return
		@resume()
		return


	on: (name, handler) ->
		@handlers[name] = handler
		return


	resume: () ->
		if !@paused then return
		@paused = false
		@target.on(@event, @handleEvent)
		return


	pause: () ->
		if @paused then return
		@paused = true
		@target.un(@event, @handleEvent)
		return


	destroy: () ->
		@pause()
		return


module.exports = KeyListener