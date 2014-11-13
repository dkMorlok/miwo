MacroSet = require './MacroSet'


class ComponentMacroSet extends MacroSet


	install: (compiler) ->
		super(compiler)
		@addMacro("reference", @macroReference)
		@addMacro("events", @macroEvents)
		@addMacro("component", @macroComponent)
		@addMacro("baseCls", @macroBaseCls)
		return


	macroReference: (content) ->
		return "html:miwo-reference=\"" + content + "\""


	macroEvents: (content) ->
		content = content.replace(/([a-zA-Z0-9]+):'?([a-zA-Z0-9]+)'?/g, "$1:\\'$2\\'")
		return "html:miwo-events=\"{" + content + "}\""


	macroComponent: (content) ->
		return "html:<div miwo-component=\"'+ (typeof " + content + "!=\"undefined\" && Type.isObject(" + content + ") ? " + content + ".name : \"" + content + "\") +'\"></div>"


	macroBaseCls: (content) ->
		return "string:me.getBaseCls(\"" + content + "\")"


module.exports = ComponentMacroSet