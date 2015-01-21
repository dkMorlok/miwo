class ComponentSelector

	selectorMatch: /^([\#\.])?([^\[]*)(.*)$/
	attributesMatch: /\[([^\]]+)\]/g
	attributeMatch: /^\[([^=\]]+)(=([^\]]*))?\]$/

	is: (component, selector) ->
		if selector is '*'
			return true

		if !(matches = selector.match(@selectorMatch))
			return false

		if matches[2]
			if matches[1] is '#'
				if matches[2] isnt component.id then return false
			else if matches[1] is '.'
				if matches[2] isnt component.name then return false
			else
				if !component.isXtype(matches[2]) then return false

		if matches[3]
			for match in matches[3].match(@attributesMatch)
				if !(attrMatches = match.match(@attributeMatch))
					return false

				if attrMatches[3] is undefined
					if !component[attrMatches[1]] then return false
				else
					if attrMatches[3].match(/^\d+$/)
						attrMatches[3] = parseInt(attrMatches[3], 10)
					else if attrMatches[3].match(/^\d+\.\d+$/)
						attrMatches[3] = parseFloat(attrMatches[3])

					if component[attrMatches[1]] isnt attrMatches[3] then return false
		return true


	queryParent: (component, selector) ->
		component = component.getParent()
		while component
			if component.is(selector) then break
			component = component.getParent()
		return component


	query: (selector, container) ->
		if selector is '>' || selector is '*'
			return container.child()

		scope = container
		parts = selector.split(' ')
		for selector in parts
			if selector is '>'
				nested = true
				continue

			if !scope.isContainer
				return null

			components = scope.components.toArray()
			scope = null # reset scope (need find it)
			while component = components.shift()
				if component.is(selector)
					scope = component
					break
				else if component.isContainer && !nested
					components.append(component.components.toArray())

			if !scope
				return null

			nested = false

		return if scope isnt container then scope else null


	queryAll: (selector, container) ->
		previousRoots = [container]
		components = container.components.toArray()

		for selector in selector.split(' ')
			if selector is '>'
				nested = true
				continue

			if components.length is 0
				return []

			selectors = selector.split(',')

			nestedRoots = []
			for component in components
				nestedRoots.push(component)

			matched = []
			while component = components.shift()
				for sel in selectors
					if component.is(sel) && previousRoots.indexOf(component) < 0
						matched.push(component)
				if component.isContainer && (!nested || nestedRoots.indexOf(component) >= 0)
					components.append(component.components.toArray())

			components = matched

			previousRoots = []
			for component in components
				previousRoots.push(component)

			nested = false

		return components


module.exports = ComponentSelector