class MacroSet

	macros: {}
	compiler: null


	install: (@compiler) ->
		return


	addMacro: (name, begin, end) ->
		@macros[name] = [begin, end]
		@compiler.addMacro(name, this)
		return


	# Initializes before template parsing.
	# @return void
	start: ->


		# Finishes template parsing.
		# @return array(prolog, epilog)
	end: ->


		# New node is found.
		# @return string
	nodeOpened: (name, content) ->
		@macros[name][0](content)


	# Node is closed.
	# @return string
	nodeClosed: (name, content) ->
		@macros[name][1](content)


module.exports = MacroSet