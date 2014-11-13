Layout = require('./Layout')

class AutoLayout extends Layout

	constructor: (config) ->
		super(config)
		@type = 'auto'
		@targetCls = ''
		@itemCls = ''

module.exports = AutoLayout