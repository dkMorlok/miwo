class LatteCompiler

	macros: {}


	addMacro: (name, macro) ->
		@macros[name] = macro
		return this


	addMacros: (macros) ->
		for name,macro of macros
			@addMacro(name, macro)
		return this


	compile: (latte, source) ->
		result = ""

		# before compile modifications
		string = @beforeCompile(source)

		# prolog
		result += @start()

		# replace every macro
		result += string.replace /\{([^\}]+)\}/g, (match, content) =>
			result = @compileCode(content)
			return (if result isnt false then result else content)

		# epilog
		result += @end()

		# after ompile modifications
		result = @afterCompile(result)
		return result


	start: ->
		return "var _tpl = '"


	end: ->
		return "';"


	compileCode: (string) ->
		matches = string.match(/^(\/)?(\S+)\s?(.*)$/)
		isClosing = matches[1]
		name = matches[2]
		content = matches[3]

		# fix string
		content = content.replace("&gt;", ">")
		content = content.replace("&lt;", ">")

		# apply modifiers
		if content
			content = content.replace /([^\|]+)\|(.+)/g, (match, data, filtersString) =>
				compiled = data
				for filter in filtersString.split("|")
					matches = filter.match(/([^:]+)(:(.*))?/)
					compiled = "filters." + matches[1] + "(" + compiled + ((if matches[3] then "," + matches[3] else "")) + ")"
				return compiled

		# apply macro
		return @writeMacro(name, content, isClosing)


	beforeCompile: (source) ->
		source = source.replace(/'/g, "\\'")
		source = source.replace(/\n/g, "")
		source = source.replace(/\r/g, "")
		source = source.replace(/\{\*.*\*\}/g, "") # {* ... *} => ""
		return source


	afterCompile: (result) ->
		result = result.replace(/>\s+</g, "> <")
		result = result.replace(/>\s+\';/g, ">';")
		result = result.replace(/(_tpl\+?=')\s+/g, "$1")
		result = result.replace(/_tpl\+=\'\s*\';/g, "")
		return result


	writeMacro: (name, content, isClosing) ->
		if !@macros[name]
			throw new Error("Undefined macro #{name}")

		macro = @macros[name]
		code = ""
		if isClosing
			code = macro.nodeClosed(name, content)
		else
			code = macro.nodeOpened(name, content)
		return @writeCode(code)


	writeCode: (code) ->
		if (matches = code.match(/(string|js|html):(.*)/))
			type = matches[1]
			content = matches[2]
		else
			type = "js"
			content = code
		return @write(type, content)


	write: (type, content) ->
		if !content
			return ""

		switch type
			when "string"
				code = "'+" + content + "+'"
			when "js"
				code = "'; " + content + " _tpl+='"
			when "html"
				code = content

		return code



module.exports = LatteCompiler