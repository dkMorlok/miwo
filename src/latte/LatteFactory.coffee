MiwoObject = require '../core/Object'
Latte = require './Latte'


class LatteFactory extends MiwoObject

	latteCompiler: @inject('latteCompiler')


	createLatte: () ->
		return new Latte(@latteCompiler)


module.exports = LatteFactory