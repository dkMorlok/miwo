MiwoObject = require '../core/Object'


class StatePersister extends MiwoObject

	state: null


	constructor: ->
		super
		@state = {}
		return


	load: (name) ->
		return @state[name]


	save: (name, data) ->
		@state[name] = data
		return


module.exports = StatePersister