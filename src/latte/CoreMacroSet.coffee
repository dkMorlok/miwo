MacroSet = require './MacroSet'


class CoreMacroSet extends MacroSet


	install: (compiler) ->
		super(compiler)
		@addMacro("if", @macroIf, @macroEnd)
		@addMacro("elseif", @macroElseIf)
		@addMacro("else", @macroElse)
		@addMacro("ifset", @macroIfSet)
		@addMacro("elseifset", @macroElseIfSet)
		@addMacro("for", @macroFor, @macroEnd)
		@addMacro("js", @macroJs)
		@addMacro("log", @macroLog)
		@addMacro("=", @macroWrite)
		@addMacro("_", @macroTranslate)
		return


	macroEnd: (content) ->
		return "}"


	macroIf: (content) ->
		return "if(" + content + ") {"


	macroElseIf: (content) ->
		return "} else if(" + content + ") {"


	macroElse: (content) ->
		return "} else {"


	macroIfSet: (content) ->
		return @macroIf "(" + content + ") !== undefined && (" + content + ") !== null)"


	macroElseIfSet: (content) ->
		return @macroElseIf "(" + content + ") !== undefined && (" + content + ") !== null)"


	macroFor: (content) ->
		# for item in array
		if (matches = content.match(/([\S]+)\s+in\s+([\S]+)/))
			name = matches[1]
			property = matches[2]
			return "for(var _i=0,_l=" + property + ".length; _i<_l; _i++) { var " + name + " = " + property + "[_i];"

		# for item,index in array
		else if (matches = content.match(/([\S]+),\s*([\S]+)\s+in\s+([\S]+)/))
			name = matches[1]
			index = matches[2]
			property = matches[3]
			return "for(var "+index+"=0,"+index+"_l=" + property + ".length; "+index+"<"+index+"_l; "+index+"++) { var " + name + " = " + property + "["+index+"];"

		# for name,value of object
		else if (matches = content.match(/([\S]+),\s*([\S]+)\s+of\s+([\S]+)/))
			name = matches[1]
			value = matches[2]
			property = matches[3]
			return "for(var " + name + " in " + property + ") { var " + value + " = " + property + "[" + name + "];"

		# someting else...
		else
			return "for(" + content + ") {"


	macroWrite: (content) ->
		return "string:" + content


	macroJs: (content) ->
		return content + ";"


	macroLog: (content) ->
		return 'console.log('+content+');';


	macroTranslate: (content) ->
		matches = content.match(/([\S]+)(\s+(.*))?/)
		out = ""
		return out  unless matches
		if matches[1].charAt(0) is "\""
			out = "string:Locale.get(" + matches[1] + ")"
		else
			out = "string:Locale.get(\"" + matches[1] + "\")"
		out += ".substitute({" + matches[3].replace("\\", "").replace("\\", "") + "})"  if matches[3]
		return out



module.exports = CoreMacroSet