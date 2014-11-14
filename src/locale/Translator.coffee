class Translator

	translates: null


	constructor: () ->
		@translates = {}
		return


	setTranslates: (name, translates) ->
		if !@translates[name]
			@translates[name] = translates
		else
			Object.merge(@translates[name], translates)
		return


	get: (key) ->
		group = @translates
		for part in key.split('.')
			group = group[part]
			if group is undefined then return null
			if !group then break
		return group



module.exports = Translator