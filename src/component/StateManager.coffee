MiwoObject = require '../core/Object'


class StateManager extends MiwoObject

	statePersister: @inject('statePersister', 'componentStatePersister')


	loadState: (stateName) ->
		values = @statePersister.load(stateName)
		return new State(this, stateName, values||{})


	saveState: (state) ->
		@statePersister.save(state.name, state.values)
		return



class State


	constructor: (@mgr, @name, @data) ->
		return


	get: (name, def) ->
		return if @data.hasOwnProperty(name) then @data[name] else def


	set: (name, value) ->
		if value isnt undefined
			@data[name] = value
		else
			delete @data[name]
		return this


	save: ->
		@mgr.saveState(this)
		return this



module.exports = StateManager