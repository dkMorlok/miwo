class DefaultFlashRender


	show: (message, type) ->
		if !console
			return
		if type is 'error'
			console.error(message)
		else
			console.log('FLASH:', message, type)
		return



class FlashNotificator

	renderer: null


	constructor: ->
		@renderer = new DefaultFlashRender()
		return


	success: (message) ->
		@message(message, 'success')
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
		@renderer.show(message, type)  if @renderer
		return


module.exports = FlashNotificator