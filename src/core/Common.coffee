#
# Function
#
Function::getter = (prop, getter) ->
	Object.defineProperty @prototype, prop, {get:getter, configurable: yes}
	return null

Function::setter = (prop, setter) ->
	Object.defineProperty @prototype, prop, {set: setter, configurable: yes}
	return null

Function::property = (prop, def) ->
	Object.defineProperty @prototype, prop, def
	return null

Function::inject = (name, service) ->
	@prototype.injects = {} if !@prototype.injects
	@prototype.injects[name] = service || name
	return null