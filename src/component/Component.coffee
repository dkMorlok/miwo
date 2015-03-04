MiwoObject = require '../core/Object'


class Component extends MiwoObject

	# @property {Boolean} true in this class to identify an object as an instantiated Component, or subclass thereof.
	isComponent: true

	# @config {String}
	xtype: 'component'

	# @config {String}
	id: null

	# @config {String}
	name: null

	# @config {String|Number}
	width: null

	# @config {String|Number}
	height: null

	# @config {String|Number}
	top: null

	# @config {String|Number}
	left: null

	# @config {String|Number}
	right: null

	# @config {String|Number}
	bottom: null

	# @config {String|Number}
	padding: null

	# @config {String|Number}
	margin: null

	# @config {String}
	html: null

	# @config {Object}
	styles: null

	# @config {String}
	cls: null

	# @config {String}
	baseCls: ""

	# @config {String}
	componentCls: ""

	# @property {Miwo.component.Container}
	container: null

	# @config {String|Object}
	# @property {Element}
	el: "div"

	# @config {String|Object}
	# @property {Element}
	contentEl: null

	# @property {Element}
	parentEl: null

	# @property {Element}
	focusEl: null

	# @property {Boolean}
	rendered: false

	# @property {Boolean}
	rendering: false

	# @property {Boolean}
	autoFocus: false

	# @property {Number}
	zIndex: null

	# @property {Boolean}
	zIndexManage: false

	# @property {Boolean}
	focusOnToFront: true

	# @property {Boolean}
	focus: false

	# @property {Boolean}
	visible: true

	# @property {Element}
	renderTo: null

	# @config {String}
	# @property {Miwo.templates.Template}
	template: null

	# @property {Boolean}
	scrollable: false

	# @property {Boolean}
	autoCenter: false

	# @property {Boolean}
	disabled: false

	# @property {String}
	role: null

	# @property {Object}
	plugins: null

	_isGeneratedId: false
	zIndexMgr: null
	componentMgr: null


	constructor: (config) ->
		@plugins = {}

		# custom initialize component (setup options)
		@beforeInit()
		if !@calledBeforeInit then throw new Error("In component #{@} you forgot call super::beforeInit()")

		# set options (can by override in doInit)
		super(config)

		# initialize component properties
		@doInit()
		if !@calledDoInit then throw new Error("In component #{@} you forgot call super::doInit()")

		# register component into managers
		miwo.componentMgr.register(this)
		miwo.zIndexMgr.register(this)  if @zIndexManage

		# initialize component after all options and properties setuped
		@afterInit()
		if !@calledAfterInit then throw new Error("In component #{@} you forgot call super::afterInit()")
		@callPlugins('init', this)
		return


	beforeInit: ->
		@calledBeforeInit = true
		return


	# Initialize component properties by configuration
	doInit: ->
		@calledDoInit = true

		# generate name if name is missing
		if !@name
			@name = miwo.componentMgr.uniqueName(@xtype)

		# generate id if id is missing
		if !@id
			@id = miwo.componentMgr.uniqueId()
			@_isGeneratedId = true

		# create base element
		@el = @createElement(@el)

		# create content element
		if @contentEl
			@contentEl = @createElement(@contentEl)
			@contentEl.inject(@el)
			@contentEl.addClass("miwo-ct")

		# set default foucs element
		@focusEl = @el
		return


	# After init manipulation with component
	# @protected
	afterInit: ->
		@calledAfterInit = true
		if @component
			parent = @component
			delete @component
			parent.addComponent(this)
		return


	# Creates element by config
	# @param {Object|String} options
	# @return {Element}
	createElement: (options) ->
		if Type.isString(options)
			return new Element(options)
		else
			tag = options.tag or "div"
			delete options.tag
			return new Element(tag, options)


	#
	# Common basic methods to access to elements
	#


	setId: (id) ->
		@_isGeneratedId = false
		@id = id
		@el.set("id", id)
		return


	getName: ->
		return @name


	getBaseCls: (suffix) ->
		return @baseCls + ((if suffix then "-" + suffix else ""))


	getContentEl: ->
		return @contentEl or @el


	setContentEl: (el) ->
		@contentEl = el
		return


	getFocusEl: ->
		@focusEl


	### not save method
    setEl: (el) ->
		@el = el
		@contentEl.inject(el) if @contentEl
		return
	###


	setParentEl: (el, position) ->
		@parentEl = (if position is "after" or position is "before" then el.getParent() else el)
		@el.inject(el, position)
		return


	getParentEl: ->
		return @parentEl


	getElement: (selector) ->
		return @el.getElement(selector)


	getElements: (selector) ->
		return @el.getElements(selector)


	#
	# Z-index managing
	#


	setZIndex: (zIndex) ->
		@el.setStyle("z-index", zIndex)
		return zIndex + 10


	getZIndex: ->
		return parseInt(@el.getStyle("z-index"), 10)


	toFront: ->
		@getZIndexManager().bringToFront(this)
		return


	toBack: ->
		@getZIndexManager().sendToBack(this)
		return


	getZIndexManager: ->
		if !@zIndexMgr then throw new Error("Component #{@name} is not managed with zIndexManager")
		return @zIndexMgr


	#
	# Component state
	#


	setActive: (active, newActive) ->
		@emit((if active then "activated" else "deactivated"), this)
		return


	setDisabled: (disabled) ->
		@disabled = disabled
		@emit("disabled", this, disabled)
		@getFocusEl().set('tabindex', -disabled)
		return


	setFocus: (silent) ->
		if @disabled then return
		@focus = true
		@getFocusEl().setFocus()
		@emit('focus', this) if !silent
		return


	blur: (silent) ->
		if @disabled then return
		@focus = false
		@getFocusEl().blur()
		@emit('blur', this) if !silent
		return


	isFocusable: ->
		return @focusEl and @rendered and @isVisible()


	isScrollable: ->
		if @scrollable is null
			# by default scrollable
			return @height or (@top isnt null and @bottom isnt null)
		else
			# by property
			return  @scrollable


	#
	# Components model
	#


	setParent: (parent, name) ->
		if parent is null and @container is null and name isnt null
			@name = name # just rename
			return this
		else if parent is @container and name is null # nothing to do
			return this

		# A component cannot be given a parent if it already has a parent.
		if @container isnt null and parent isnt null
			throw new Error("Component '#{@name}' already has a parent '#{@container.name}' and you try set new parent '#{parent.name}'.")

		# Set or overwrite name
		if name then @name = name

		# add/remove parent
		if parent isnt null
			@container = parent
			@attachedContainer(@container)
			@emit('attached', this, parent)
		else
			@detachedContainer(@container)
			@emit('detached', this)
			@container = null
		return this


	is: (selector) ->
		return miwo.componentSelector.is(this, selector)


	isXtype: (xtype) ->
		return  @xtype is xtype


	getParent: (selector) ->
		return if selector then miwo.componentSelector.queryParent(this, selector) else @container


	nextSibling: ->
		return @getParent().nextSiblingOf(this)


	previousSibling: ->
		return @getParent().previousSiblingOf(this)


	# called when component is attached to parent
	attachedContainer: (parent) ->
		return


	# called when component is detached from parent
	detachedContainer: (parent) ->
		return


	#
	# Plugins
	#


	installPlugin: (name, plugin) ->
		if @plugins[name] then throw new Error("Plugin #{name} already installed in component #{this}")
		@plugins[name] = plugin
		return


	uninstallPlugin: (name) ->
		if !@plugins[name] then return
		@plugins[name].destroy()
		delete @plugins[name]
		return


	getPlugin: (name) ->
		if !@plugins[name] then throw new Error("Plugin #{name} is not installed in component #{this}")
		return @plugins[name]


	hasPlugin: (name) ->
		return @plugins[name] isnt undefined


	callPlugins: (method, args...) ->
		for name,plugin of @plugins
			if plugin[method]
				plugin[method].apply(plugin, args)
		return


	#
	# Rendering
	#


	hasTemplate: ->
		return @template isnt null


	getTemplate: ->
		if @template and Type.isString(@template)
			@template = @createTemplate(@template)
		return @template


	createTemplate: (source) ->
		template = miwo.service('templateFactory').createTemplate()
		template.setSource(source)
		template.setTarget(@getContentEl())
		template.set("me", this)
		template.set("component", this)
		return template


	update: ->
		return


	resetRendered: (dispose) ->
		@rendered = false
		@parentEl = null
		if dispose
			@el.empty()
			@el.dispose()
		return


	render: (el, position) ->
		el = @renderTo if @renderTo
		if @rendered then return

		if position is 'replace'
			@el.replaces($(el))
			@parentEl = @el.getParent()
		else
			if el and !@parentEl then @setParentEl(el, position)

		# call before rendering started
		@beforeRender()
		if !@calledBeforeRender then throw new Error("In component #{@} you forgot call super::beforeRender()")
		@callPlugins('beforeRender', this)

		# find contentEl and try to change
		contentEl = @getElement('[miwo-reference="contentEl"]')
		@contentEl = contentEl  if contentEl

		# mark component as "in rendering procecss"
		@rendering = true
		@emit("render", this, @el)

		# render component
		@doRender()
		@callPlugins('doRender', this)

		# map references
		@getElements("[miwo-reference]").each (el) =>
			this[el.getAttribute("miwo-reference")] = el
			el.removeAttribute "miwo-reference"
			return

		# mark component as "rendered"
		@rendered = true
		@rendering = false

		# after render modifications, component is rendered, by default this method handle events setup and other funcionality
		@calledAfterRender = false
		@afterRender()
		if !@calledAfterRender then throw new Error("In component #{@} you forgot call super::afterRender()")
		@callPlugins('afterRender', this)

		# notify rendered
		@emit("rendered",  this, @getContentEl())
		return


	replace: (target) ->
		target = target || $(@id)
		@render(target, 'replace') if target
		return


	redraw: ->
		@resetRendered()
		@render()
		return


	beforeRender: ->
		@calledBeforeRender = true

		el = @el
		el.setVisible(@visible)

		# setup properties
		el.set("miwo-name", @name)
		el.store("component", this)
		el.set("id", @id)  if !@_isGeneratedId
		el.set("role", @role)  if !@role

		# setup classes
		el.addClass(@cls)  if @cls
		el.addClass(@baseCls)  if @baseCls
		el.addClass(@componentCls)  if @componentCls

		# setup styles
		el.setStyles(@styles)  if @styles isnt null
		el.setStyle("width", @width)  if @width isnt null
		el.setStyle("height", @height)  if @height isnt null
		el.setStyle("top", @top)  if @top isnt null
		el.setStyle("bottom", @bottom)  if @bottom isnt null
		el.setStyle("left", @left)  if @left isnt null
		el.setStyle("right", @right)  if @right isnt null
		el.setStyle("zIndex", @zIndex)  if @zIndex isnt null
		el.setStyle("padding", @padding)  if @padding isnt null
		el.setStyle("margin", @margin)  if @margin isnt null

		# notify manager
		@componentMgr.beforeRender(this)
		return


	doRender: ->
		if @template
			@getTemplate().render()
		else if @html
			@getContentEl().set("html", @html)

		# map references
		@getElements("[miwo-reference]").each (el) =>
			this[el.getAttribute("miwo-reference")] = el
			el.removeAttribute "miwo-reference"
			return
		return


	afterRender: ->
		@calledAfterRender = true

		# set events
		@getElements("[miwo-events]").each (el) =>
			events = el.getAttribute("miwo-events").split(",")
			for event in events
				parts = event.split(":", 2)
				if !this[parts[1]]
					throw new Error("[Component::afterRender] In component #{@name} is undefined callback '#{parts[1]}' for event '#{parts[0]}'")
				el.on(parts[0], @bound(parts[1]))
			el.removeAttribute("miwo-events")
			return

		# notify manager
		@componentMgr.afterRender(this)
		return


	#
	# Visibility
	#


	setVisible: (visible) ->
		if visible then @show() else @hide()
		return


	isVisible: ->
		return @visible


	setPosition: (pos) ->
		dsize = document.getSize()
		size = @el.getSize()
		pos.x = Math.max(10, Math.min(pos.x, dsize.x-size.x-10))
		#pos.y = Math.max(10, Math.min(pos.y, dsize.y-size.y-10))
		@top = pos.y
		@left = pos.x
		@el.setStyle("top", @top)
		@el.setStyle("left", @left)
		return


	show: ->
		if @visible then return
		@emit("show", this)
		@render()
		@doShow()
		@parentShown(this)
		@emit("shown", this)
		this


	showAt: (pos) ->
		@show() # need to setup element sizes
		@setPosition(pos)
		return


	doShow: ->
		el = @el
		el.setStyle("top", @top)  if @top isnt null
		el.setStyle("bottom", @bottom)  if @bottom isnt null
		el.setStyle("left", @left)  if @left isnt null
		el.setStyle("right", @right)  if @right isnt null
		el.show()
		@visible = true
		if (!@top || !@left) and @autoCenter then @center()
		return


	parentShown: (parent) ->
		@emit("parentshown", parent)
		return


	hide: ->
		if !@visible then return
		@emit("hide", this)
		@doHide()
		@emit("hiden", this)
		this


	doHide: ->
		@visible = false
		@el.hide()
		return


	center: ->
		if !@left
			@el.setStyle("left", (@parentEl.getWidth() - @el.getWidth()) / 2)
		if !@top
			@el.setStyle("top", (@parentEl.getHeight() - @el.getHeight()) / 2)
		return


	setSize: (width, height) ->
		if Type.isObject(width)
			height = width.height
			width = width.width
		if height isnt undefined and height isnt null
			@height = height
			@el.setStyle("height", height)
		if width isnt undefined and width isnt null
			@width = width
			@el.setStyle("width", width)
		@emit("resize", this)
		return


	getSize: ->
		return
		width: @el.getWidth()
		height: @el.getHeight()


	#
	# Destroying
	#


	beforeDestroy: ->
		@emit("destroy", this)
		@container.removeComponent(@name)  if @container
		miwo.zIndexMgr.unregister(this)  if @zIndexManage
		miwo.componentMgr.unregister(this)
		return


	doDestroy: ->
		@template.destroy() if @template?.destroy?
		@el.eliminate("component")
		@el.destroy()
		for name,plugin of @plugins then @uninstallPlugin(name)
		return


	afterDestroy: ->
		@emit("destroyed", this)
		return



module.exports = Component