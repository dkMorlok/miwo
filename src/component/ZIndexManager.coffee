MiwoObject = require '../core/Object'
Overlay = require '../utils/Overlay'


class ZIndexManager extends MiwoObject

	zIndexBase: 10000
	zIndex: 0
	list: null
	stack: null
	front: null
	overlay: null


	constructor: ->
		super
		@list = {}
		@stack = []
		@zIndex = @zIndexBase
		return


	# Registers a floating {@link Miwo.component.Component} with this ZIndexManager. This should not
	# need to be called under normal circumstances. Floating Components (such as Windows,
	# BoundLists and Menus) are automatically registered
	# @param {Miwo.component.Component} comp The Component to register.
	register: (comp) ->
		comp.zIndexMgr.unregister(comp)  if comp.zIndexMgr
		comp.zIndexMgr = this
		@list[comp.id] = comp
		@stack.push(comp)
		comp.on("hide", @bound("onComponentHide"))
		return


	# Unregisters a {@link Miwo.component.Component} from this ZIndexManager. This should not
	# need to be called. Components are automatically unregistered upon destruction.
	# @param {Miwo.component.Component} comp The Component to unregister.
	unregister: (comp) ->
		if @list[comp.id]
			comp.un("hide", @bound("onComponentHide"))
			delete @list[comp.id]
			@stack.erase(comp)
			delete comp.zIndexMgr
			@activateLast() if @front is comp
		return


	# Gets a registered Component by id.
	# @return {Miwo.component.Component}
	get: (id) ->
		return (if id.isComponent then id else @list[id])


	# Gets the currently-active Component in this ZIndexManager.
	# @return {Miwo.component.Component} The active Component
	getActive: ->
		return @front


	onComponentHide: ->
		@activateLast()
		return


	actualize: ->
		@zIndex = @setZIndexies(@zIndexBase)
		return


	setZIndexies: (zIndex) ->
		for comp in @stack
			zIndex = comp.setZIndex(zIndex) # returns new z-index
		@activateLast()
		return zIndex


	setActiveChild: (comp, oldFront) ->
		if comp isnt @front
			if @front and !@front.destroying
				@front.setActive(false, comp)
			@front = comp
			if comp and comp isnt oldFront
				# If the previously active comp did not take focus, then do not disturb focus state by focusing the new front
				# comp.preventFocusOnActivate = oldFront && (oldFront.preventFocusOnActivate || !oldFront.focusOnToFront);
				if comp.focusOnToFront
					comp.setFocus()
				comp.setActive(true)
				if comp.modal
					@showOverlay(comp)

				# Restore the new front's focusing flag
				# comp.preventFocusOnActivate = oldPreventFocus;
		return


	activateLast: ->
		index = @stack.length - 1

		# Go down through the z-index stack.
		# Activate the next visible one down.
		# If that was modal, then we're done
		while index >= 0 and !@stack[index].isVisible()
			index--

		# The loop found a visible floater to activate
		if index >= 0
			comp = @stack[index]
			@setActiveChild(comp, @front)
			if comp.modal then return
		# No other floater to activate, just deactivate the current one
		else
			@front.setActive(false)  if @front
			@front = null

		# If the new top one was not modal, keep going down to find the next visible
		# modal one to shift the modal mask down under
		while index >= 0
			comp = @stack[index]
			# If we find a visible modal further down the zIndex stack, move the mask to just under it.
			if comp.isVisible() and comp.modal
				@showOverlay(comp)
				return
			index--

		# No visible modal Component was found in the run down the stack.
		# So hide the modal mask
		@hideOverlay()
		return


	showOverlay: (comp) ->
		if !@overlay
			@overlay = new Overlay(miwo.body)
			@overlay.on 'click', ()=>
				if @front
					@front.setFocus(true)
					@front.onOverlayClick()  if @front.onOverlayClick
				return

		@overlay.setZIndex(comp.getZIndex() - 1)
		@overlay.open()
		return


	hideOverlay: ->
		if @overlay
			@overlay.close()
		return


	# Brings the specified Component to the front of any other active Components in this ZIndexManager.
	# @param {String/Object} comp The id of the Component or a {@link Miwo.component.Component} instance
	# @return {Boolean} True if the dialog was brought to the front, else false if it was already in front
	bringToFront: (comp) ->
		changed = false
		comp = @get(comp)
		if comp isnt @front
			@stack.erase(comp)
			@stack.push(comp)
			@actualize()
			@front = comp
			changed = true
		if changed and comp.modal
			@showOverlay(comp)
		return changed


	# Sends the specified Component to the back of other active Components in this ZIndexManager.
	# @param {String/Object} comp The id of the Component or a {Miwo.component.Component} instance
	# @return {Miwo.component.Component} The Component
	sendToBack: (comp) ->
		comp = @get(comp)
		@stack.erase(comp)
		@stack.unshift(comp)
		@actualize()
		return comp


	doDestroy: ->
		if @overlay
			@overlay.destroy()
			delete @overlay

		for id of @list
			@unregister(@get(id))

		delete @front
		delete @stack
		delete @list
		super()
		return


module.exports = ZIndexManager