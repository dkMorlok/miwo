Layout = require('./Layout')

class FitLayout extends Layout

	constructor: (config) ->
		super(config)
		@type = 'fit'
		@targetCls = 'miwo-layout-fit'
		@itemCls = 'miwo-layout-item'

module.exports = FitLayout