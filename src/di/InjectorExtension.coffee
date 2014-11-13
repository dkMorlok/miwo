DiHelper = require './DiHelper'

class InjectorExtension

	config: null
	injector: null


	constructor: () ->
		@config = {}


	init: () ->
		return


	setConfig: (config) ->
		Object.merge(@config, DiHelper.expand(config, @injector))
		return


module.exports = InjectorExtension