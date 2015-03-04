NativeEvents = require('events')

class Events extends NativeEvents

	managedListeners: null
	managedRelays: null
	bounds: null


	constructor: () ->
		@managedListeners = []
		@managedRelays = []
		@bounds = {}


	bound: (name) ->
		if !@bounds[name]
			if !@[name] then throw new Error("Method #{name} is undefined in object #{@}")
			@bounds[name] = @[name].bind(this)
		return @bounds[name]


	addListener: (name, listener) ->
		if Type.isString(listener) then listener = @bound(listener)
		super(name, listener)
		return


	addListeners: (listeners) ->
		for name, listener of listeners
			@addListener(name, listener)
		return


	removeListener: (name, listener) ->
		if Type.isString(listener) then listener = @bound(listener)
		super(name, listener)
		return


	removeListeners: (name) ->
		@removeAllListeners(name)
		return


	on: (name, listener) ->
		if Type.isObject(name)
			@addListeners(name)
		else
			@addListener(name, listener)
		return


	un: (name, listener) ->
		if listener
			@removeListener(name, listener)
		else
			if Type.isObject(name)
				for n,l of name then @removeListener(n, l)
			else
				@removeListeners(name)
		return




	addManagedListener: (object, name, listener) ->
		if Type.isString(listener) then listener = @bound(listener)
		object.on(name, listener)
		@managedListeners.push
			object: object
			name: name
			listener: listener
		return


	addManagedListeners: (object, listeners) ->
		for n,l of listeners
			@addManagedListener(object, n, l)
		return


	removeManagedListeners: (object, name, listener) ->
		toRemove = []
		for m in @managedListeners
			if Type.isString(listener) then listener = @bound(listener)
			if (!object || m.object is object) && (!name || m.name is name) && (!listener || m.listener is listener)
				toRemove.push(m)
		for m in toRemove
			m.object.un(m.name, m.listener)
			@managedListeners.erase(m)
		return


	mon: (object, name, listener) ->
		if listener
			@addManagedListener(object, name, listener)
		else
			@addManagedListeners(object, name)
		return


	mun: (object, name, listener) ->
		@removeManagedListeners(object, name, listener)
		return


	munon: (old, obj, name, listener) ->
		#return  if old is obj
		@mun(old, name, listener)  if old
		@mon(obj, name, listener)  if obj
		return


	_destroyManagedListeners: ->
		@removeManagedListeners()
		return




	relayEvents: (object, events, prefix) ->
		listeners = {}
		prefix = prefix || ''
		for event in events
			listeners[event] = @createRelay(event, prefix)
			object.addListener(event, listeners[event])
		return {
			target: object
			destroy: () -> object.removeListeners(listeners)
		}


	createRelay: (event, prefix) ->
		return (args...) =>
			args.unshift(prefix+event)
			@emit.apply(this, args)


	addRelay: (object, events, prefix) ->
		relay = @relayEvents(object, events, prefix)
		@managedRelays.push
			object: object
			relay: relay
		return


	removeRelay: (object) ->
		toRemove = []
		for relay in @managedRelays
			if !object or relay.object is object
				toRemove.push(relay)
		for relay in toRemove
			relay.relay.destroy()
			@managedRelays.erase(relay)
		return


	relay: (object, events, prefix) ->
		@addRelay(object, events, prefix)
		return


	unrelay: (object) ->
		@removeRelay(object)
		return


	_destroyManagedRelays: ->
		@removeRelay()
		return



module.exports = Events