class FlashNotificator

	renderer: null


	constructor: () ->
		@renderer = (message, type) ->
			if console then console.log('FLASH:', message, type)
			return


	error: (message) ->
		@message(message, 'error')
		return


	info: (message) ->
		@message(message, 'info')
		return


	warning: (message) ->
		@message(message, 'warning')
		return


	message: (message, type) ->
		if !@renderer then return
		@renderer(message, type)
		return


module.exports = FlashNotificator