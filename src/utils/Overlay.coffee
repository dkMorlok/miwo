MiwoObject = require '../core/Object'


class Overlay extends MiwoObject

	# @event click
	# @event close
	# @event hide
	# @event open
	# @event show

	color: "#000"
	opacity: 0.5
	zIndex: 5000
	target: null
	overlay: null


	constructor: (@target, config) ->
		super(config)

		@overlay = new Element "div",
			parent: @target
			cls: "miwo-overlay"
			styles:
				position: "absolute"
				background: @color
				"z-index": @zIndex

		@overlay.on('click', ()=>@emit('click'))
		return


	setZIndex: (zIndex) ->
		@overlay.setStyle("z-index", zIndex)
		return


	open: ->
		@emit("open")
		@target.addClass("miwo-overlayed")
		@overlay.setStyle("display", "block")
		(()=>@overlay.setStyle("opacity", @opacity)).delay(1)
		@emit("show")
		return


	close: ->
		@emit("close")
		@target.removeClass("miwo-overlayed")
		@overlay.setStyle("opacity", 0.0)
		(()=>@overlay.setStyle("display", "none")).delay(300)
		@emit("hide")
		return


	doDestroy: ->
		@overlay.destroy()
		super()
		return


module.exports = Overlay