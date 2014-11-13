Layout = require('./Layout')

class FormLayout extends Layout

	constructor: (config) ->
		super(config)
		@type = 'form'
		@targetCls = 'miwo-layout-form'
		@itemCls = ''


module.exports = FormLayout