Latte = require './Latte'

class LatteFactory

	@inject: ['latteCompiler']
	latteCompiler: null


	createLatte: () ->
		return new Latte(@latteCompiler)


module.exports = LatteFactory