class DiHelper

	expandRe: /^<%([\S]+)%>$/
	expandStringRe: /<%([\S]+)%>/g
	serviceRe: /^@([^:]+)(:([^\(]+)(\((.*)\))?)?$/
	codeRe: /^(\$)?([^\(]+)\((.*)\)$/


	expand: (param, injector) ->
		if Type.isString(param)
			if (matches = param.match(@expandRe))
				param = @expand(@getSection(injector.params, matches[1]), injector)

			else if (matches = param.match(@expandStringRe))
				for match in matches
					param = param.replace(match, @expand(match, injector))

		else if Type.isObject(param)
			for name,value of param
				param[name] = @expand(value, injector)

		# nothing to expand, just return value
		return param


	evaluateCode: (service, code, injector) ->
		if Type.isArray(code)
			values = code
			code = values.shift()
			extraArgs = @evaluateArgs(values, injector)

		if (matches = code.match(@codeRe))
			isProperty = matches[1]
			operation = matches[2]
			args = matches[3]
			evalArgs = if args then @evaluateArgs(args, injector) else []
			for arg,index in evalArgs
				if arg is '?' and extraArgs.length>0
					evalArgs[index] = extraArgs.shift()
			if isProperty
				service[operation] = evalArgs[0]
			else
				if !service[operation]
					throw new Error("Cant call method '#{operation}' in service '#{service.constructor.name}'. Method is not defined")
				service[operation].apply(service, evalArgs)
		return


	evaluateArgs: (args, injector) ->
		result = []
		if Type.isString(args)
			args = args.split(',')
		for arg in args
			if !Type.isString(arg)
				result.push(arg)
				continue

			value = @expand(arg, injector)
			if !Type.isString(value)
				result.push(value)
				continue

			# can by expanded to object need test again
			matches = value.match(@serviceRe)
			if !matches
				result.push(value)
				continue

			name = matches[1]
			op = matches[3] || null
			opCall = matches[4] || null
			opArgs = matches[5] || null
			instance = injector.get(name)

			if !op
				result.push(instance)
			else
				if !instance[op]
					throw new Error("Cant call method #{op} in service #{name} of #{instance.constructor.name}. Method is not defined")
				if !opCall
					result.push ()=> instance[op].call(instance)
				else if !args
					result.push(instance[op].call(instance))
				else
					result.push(instance[op].apply(instance, @evaluateArgs(opArgs, injector)))

		return result


	getSection: (config, section) ->
		pos = section.indexOf('.')
		if pos > 0
			section = @getSection(config[section.substr(0, pos)], section.substr(pos+1))
		else if config && config[section] isnt undefined
			section = config[section]
		else
			section = null
		return section



module.exports = new DiHelper