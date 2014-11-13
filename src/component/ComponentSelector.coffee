class ComponentSelector

	selectParent: (component, selector) ->
		component = @getParent()
		while component
			if component.is(selector) then break
			component = component.getParent()
		return component


	is: (component, selector) ->
		if selector.test(/^\#([\w\-]+)/)
			return selector.replace(/\#/, "") is component.id
		else if selector
			return component.isXtype(selector)
		else
			return false


	select: (selector, component = null) ->
		throw new Error("Not implemented")
		return


	selectAll: (selector, component = null) ->
		throw new Error("Not implemented")
		return


module.exports = ComponentSelector