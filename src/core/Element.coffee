Element.Properties.cls =
	get: ->
		return @get("class")

	set: (v) ->
		return @set("class", v)

	erase: ->
		@erase("class")
		return


Element.Properties.parent =
	get: ->
		return @getParent() #returns the element's parent

	set: (p) ->
		@inject(p)  if p
		return


Element.Properties.children =
	get: ->
		return @getChildren()

	set: (value) ->
		@adopt(value)
		return


Element.Properties.location =
	set: (l) ->
		@setStyle "top", l[0]  if l[0] isnt null
		@setStyle "right", l[1]  if l[1] isnt null
		@setStyle "bottom", l[2]  if l[2] isnt null
		@setStyle "left", l[3]  if l[3] isnt null
		return


Element.Properties.on =
	set: (o) ->
		@addEvents(o)
		return


Element.implement({

	isDisplayed: ->
		return @getStyle('display') isnt 'none'


	isVisible: ->
		w = @offsetWidth
		h = @offsetHeight
		if w is 0 && h is 0
			return false
		else if w > 0 && h > 0
			return true
		else
			return @style.display isnt 'none'


	toggle: ->
		return this[if @isDisplayed() then 'hide' else 'show']();


	hide: ->
		#IE fails here if the element is not in the dom
		try d = @getStyle('display') catch e
		if d is 'none' then return this
		return @store('element:_originalDisplay', d || '').setStyle('display', 'none')


	show: (display) ->
		if !display && @isDisplayed() then return this
		display = display || @retrieve('element:_originalDisplay') || 'block'
		return @setStyle('display', if display is 'none' then  'block' else display)


	setVisible: (visible) ->
		this[(if visible then "show" else "hide")]()
		return


	toggleClass: (cls, toggled) ->
		if toggled is true || toggled is false
			if toggled is true
				@addClass(cls) if !@hasClass(cls)
			else
				@removeClass(cls) if @hasClass(cls)
		else
			if @hasClass(cls)
				@removeClass(cls)
			else
				@addClass(cls)
		return this


	swapClass: (remove, add) ->
		return @removeClass(remove).addClass(add)


	getIndex: (query) ->
		return this.getAllPrevious(query).length


	setFocus: (tabIndex) ->
		@setAttribute( "tabIndex", tabIndex or 0)
		@focus()
		return


	setClass: (cls, enabled) ->
		if enabled
			@addClass(cls) if !@hasClass(cls)
		else
			@removeClass(cls) if @hasClass(cls)
		return
})


# event shortcuts
EventShortcuts =
	emit: (type, args, delay) ->
		@fireEvent type, args, delay

	on: (type, fn) ->
		if Type.isString(type)
			@addEvent type, fn
		else
			@addEvents type

	un: (type, fn) ->
		if Type.isString(type)
			@removeEvent type, fn
		else
			@removeEvents type

Object.append(window, EventShortcuts)
Object.append(document, EventShortcuts)
Request.implement(EventShortcuts)
Events.implement(EventShortcuts)
Element.implement(EventShortcuts)


Function::getter = (prop, getter) ->
	Object.defineProperty @prototype, prop, {get:getter, configurable: yes}
	return

Function::setter = (prop, setter) ->
	Object.defineProperty @prototype, prop, {set: setter, configurable: yes}
	return

Function::property = (prop, def) ->
	Object.defineProperty @prototype, prop, def
	return
