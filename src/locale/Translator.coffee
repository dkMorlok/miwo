class Translator

	translates: null
	lang: null
	defaultLang: null


	constructor: () ->
		@translates = {}
		return


	setDefault: (@defaultLang) ->
		return


	setTranslates: (lang, name, translates) ->
		if !@defaultLang
			@defaultLang = lang
			@lang = lang

		if !@translates[lang]
			@translates[lang] = {}

		if !@translates[lang][name]
			@translates[lang][name] = translates
		else
			Object.merge(@translates[lang][name], translates)
		return


	use: (@lang) ->
		return


	get: (key) ->
		translated = @getByLang(key, @lang)
		if translated is null
			translated = @getByLang(key, @defaultLang)
		if translated is null
			translated = key
		return translated


	getByLang: (key, lang) ->
		group = @translates[lang]
		if !group
			return null
		for part in key.split('.')
			group = group[part]
			if group is undefined then return null
			if !group then break
		return group


module.exports = Translator