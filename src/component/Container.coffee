layout = require '../layout'
Component = require './Component'
Collection = require '../utils/Collection'


class Container extends Component

	isContainer: true

	xtype: 'container'

	# @config {String} layout  Use layout for render child components
	layout: 'auto'

	components: null



	doInit: ->
		super()
		@components = new Collection()
		return



	# Component Model


	# Add component to this container
	# @param {String} name
	# @param {Miwo.component.Component} component
	# @returns {Miwo.component.Component}
	addComponent: (name, component) ->
		if !Type.isString(name)
			component = name
			name = component.name

		if not name or not name.test(/^[a-zA-Z0-9]+$/)
			throw new Error("Component name must be non-empty alphanumeric string, '" + name + "' given.")

		if @components.has(name)
			throw new Error("Component with name '" + name + "' already exists.")

		# check circular reference
		obj = this
		loop
			if obj is component
				throw new Error("Circular reference detected while adding component '" + name + "'.")
			obj = obj.getParent()
			break if obj is null

		# user checking
		@validateChildComponent(component)
		@emit("add", this, component)

		try
			@components.set(name, component)
			component.setParent(this, name)
		catch error
			@components.remove(name)
			console.log(error, error.stack)
			throw error

		@addedComponent(component)
		@addedComponentDeep(component)
		@emit("added", this, component)
		@renderComponent(component) if @rendered
		return component


	addedComponent: (component) ->
		return


	# propagate to parent
	addedComponentDeep: (component) ->
		@container.addedComponentDeep(component)  if @container
		return


	removeComponent: (name) ->
		if !@components.has(name)
			throw new Error("Component named '" + name + "' is not located in this container.")

		component = @components.get(name)
		@emit("remove", this, component)
		component.setParent(null)
		@components.remove(name)
		@removedComponent(component)
		@removedComponentDeep(component)
		@emit("removed", this, component)
		return


	removedComponent: (component) ->
		return

	# propagate to parent
	removedComponentDeep: (component) ->
		parent = @getParent()
		parent.removedComponentDeep(component)  if parent
		return


	# Get component by name
	# @param {String} name
	# @param {Boolean} need
	# @returns {Miwo.component.Component}
	getComponent: (name, need = true) ->
		if !name
			throw new Error("Component or subcomponent name must not be empty string.")

		ext = null
		pos = name.indexOf("-")
		if pos > 0
			ext = name.substring(pos + 1)
			name = name.substring(0, pos)

		if name is "parent"
			return if !ext then @component else @component.getComponent(ext, need)

		if !@components.has(name)
			component = @createComponent(name)
			if component && component.getParent() is null
				@addComponent(name, component)

		if @components.has(name)
			if !ext
				return @components.get(name)
			else
				return @components.get(name).getComponent(ext, need)
		else if need
			throw new Error("Component with name '" + name + "' does not exist.")
		return


	createComponent: (name) ->
		method = 'createComponent'+name.capitalize()
		if this[method]
			component = this[method](name)
			if !component && !@components.has(name)
				throw new Error("Method #{this}::#{method}() did not return or create the desired component.")
			return component
		return null


	hasComponents: ->
		return @components.length > 0


	getComponents: ->
		return @components


	findComponents: (deep = false, filters = {}, components = []) ->
		@components.each (component) ->
			matched = false
			for name,value of filters
				filtered = true
				if component[name] is value
					matched = true
					break

			if !filtered || matched
				matched = true
				components.push(component)

			if component.isContainer && deep
				component.findComponents(deep, filters, components)
			return
		return components


	findComponent: (deep = false, filters = {}) ->
		components = @findComponents(deep, filters)
		return if components.length > 0 then components[0] else null


	validateChildComponent: (child) ->
		return



	# Traversing


	firstChild: ->
		return @components.getFirst()


	lastChild: ->
		return @components.getLast()


	nextSiblingOf: (component) ->
		index = @components.indexOf(component)
		return (if index + 1 < @components.length then @components.getAt(index + 1) else null)


	previousSiblingOf: (component) ->
		index = @components.indexOf(component)
		return (if index > 0 then @components.getAt(index - 1) else null)


	find: (selector = "*") ->
		return miwo.componentSelector.query(selector, this)


	findAll: (selector = "*") ->
		return miwo.componentSelector.queryAll(selector, this)


	child: (selector = "*") ->
		matched = null
		@components.each (component)=>
			if !matched && component.is(selector)
				matched = component
			return
		return matched


	get: (name, need = false) ->
		return @getComponent(name, need)


	add: (name, component) ->
		return @addComponent(name, component)


	remove: (name) ->
		return @removeComponent(name)



	# Utils


	setFocus: ->
		super()
		@focusedParent(this)
		return


	focusedParent: (parent) ->
		@components.each (component) ->
			if component.autoFocus
				component.setFocus()
			else if component.isContainer
				component.focusedParent(parent)
			return
		return



	# Rendering


	update: () ->
		if @layout && @layout instanceof layout.Layout
			@layout.update()
		return


	hasLayout: ->
		return @layout isnt null && @layout isnt false


	setLayout: (object = null) ->
		if @layout && @layout instanceof layout.Layout && !object
			@layout.setContainer(null)
			@layout = null
		if object
			@layout = object
			@layout.setContainer(this)
			@layout.initLayout()
		return


	getLayout: ->
		if Type.isString(@layout)
			@setLayout(layout.createLayout(@layout))
		return @layout


	resetRendered: (dispose) ->
		super
		@components.each (component)-> component.resetRendered(dispose)
		return


	doRender: ->
		super
		# custom container rendering
		@renderContainer()

		# render components (if not rendered by renderContainer)
		@components.each (component)=>
			@renderComponent(component)  if !component.rendered

		# render component by layout (if not rendered in renderComponent)
		if @layout
			@getLayout().render()
		return


	renderContainer: ->
		# find nested child components
		topComponentEls = []
		for el in @getElements("[miwo-component]")
			skipElement = false
			if topComponentEls.contains(el)
				skipElement = true
			else
				for parent in el.getParents('[miwo-component]')
					if topComponentEls.contains(parent)
						skipElement = true
						continue
			if !skipElement
				topComponentEls.push(el)

		# replace component's el with finded el
		for el in topComponentEls
			component = @get(el.getAttribute("miwo-component"), true)
			component.replace(el)
		return


	renderComponent: (component) ->
		if !component.preventAutoRender
			component.render(@getContentEl())
		return


	parentShown: (parent) ->
		super(parent)
		@components.each (component) ->
			component.parentShown(parent)
			return
		return


	removeAllComponents: ->
		@components.each (component, name) =>
			@removeComponent(name)
			component.destroy()
			return
		return


	doDestroy: ->
		@removeAllComponents()
		@setLayout(null) if @hasLayout()
		super()




module.exports = Container