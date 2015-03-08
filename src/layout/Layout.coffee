MiwoObject = require ('../core/Object')

class Laoyut extends MiwoObject

	isLayout: true
	targetCls: "miwo-layout"
	itemCls: "miwo-layout-item"
	container: null
	initialized: false
	running: false
	ownerLayout: null
	enabled: true


	setContainer: (container) ->
		@munon(@container, container, 'added', @bound("onAdded"))
		@munon(@container, container, 'removed', @bound("onRemoved"))
		@container = container
		return


	# Returns the set of items to layout (empty by default).
	# @return {Array} components
	# @protected
	getLayoutComponents: ->
		return @container.getComponents()


	# Returns the target element where child will be rendered
	# @protected
	getRenderTarget: ->
		return @container.getContentEl()


	# A one-time initialization method called just before rendering.
	# @protected
	initLayout: ->
		@initialized = true
		return


	# Sets layout owner
	# @private
	setOwnerLayout: (layout) ->
		@ownerLayout = layout
		return


	render: ->
		@getRenderTarget().addClass(@targetCls)  if @targetCls
		@update()
		return


	update: ->
		@renderComponents(@getLayoutComponents(), @getRenderTarget())
		return


	onAdded: (container, component, position) ->
		if container.rendered
			@renderComponent(component, @getRenderTarget(), position)
		return


	onRemoved: (container, component) ->
		if container.rendered
			@removeComponent(component)
		return


	# Iterates over all passed items, ensuring they are rendered.  If the items are already rendered,
	# also determines if the items are in the proper place in the dom.
	# @protected
	renderComponents: (components, target) ->
		if !@enabled then return
		components.each (component, index) =>
			if !component.rendered
				@renderComponent(component, target, index)
			else
				@updateComponent(component)
		return


	# Renders the given Component into the target Element.
	# @param {Miwo.component.Component} item The Component to render
	# @param {Element} target The target Element
	# @param {Number} position The position within the target to render the item to
	# @private
	renderComponent: (component, target, position) ->
		if !@enabled then return
		if !component.rendered && !component.preventAutoRender
			@configureComponent(component)
			component.render(target)
			@afterRenderComponent(component)
		return


	# Update component and child components
	# @param {Miwo.component.Component} item The Component to render
	# @private
	updateComponent: (component) ->
		@configureComponent(component)
		component.update()
		return


	# Called before an item is rendered to allow the layout to configure the item.
	# @param {Miwo.component.Component} item The item to be configured
	# @protected
	configureComponent: (component) ->
		if component.isContainer && component.hasLayout()
			component.getLayout().setOwnerLayout(this)

		component.el.addClass(@itemCls) if @itemCls
		component.el.setStyle('width', component.width) if component.width || component.width is null
		component.el.setStyle('height', component.height) if component.height || component.height is null
		return


	afterRenderComponent: (component) ->
		return


	# Remove component from owner components.
	# @param {Miwo.component.Component} item The Component to remove
	# @private
	removeComponent: (component) ->
		if component.rendered
			@unconfigureComponent(component)
			component.el.dispose()
			@afterRemoveComponent(component)
		return


	# Reverse of configure component
	# @param {Miwo.component.Component} item The item to be configured
	# @protected
	unconfigureComponent: (component) ->
		if component.isContainer && component.hasLayout()
			component.getLayout().setOwnerLayout(null)

		component.el.removeClass(@itemCls) if @itemCls
		component.el.setStyle('width', null) if component.width
		component.el.setStyle('height', null) if component.height
		return


	# Removes layout's itemCls and owning Container's itemCls.
	# Clears the managed dimensions flags
	# @protected
	afterRemoveComponent: (component) ->
		return


	# Destroys this layout. This method removes a `targetCls` from the `target`
	# element and calls `doDestroy`.
	# A derived class can override either this method or `doDestroy` but in all
	# cases must call the base class versions of these methods to allow the base class to
	# perform its cleanup.
	# @protected
	doDestroy: ->
		@getRenderTarget().removeClass(@targetCls) if @targetCls
		@setContainer(null)
		super()
		return


module.exports = Laoyut