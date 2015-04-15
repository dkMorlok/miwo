Layout = require('./Layout')


class AbsoluteLayout extends Layout


	constructor: (config) ->
		super(config)
		@type = 'absolute'
		@targetCls = 'miwo-layout-absolute'
		@itemCls = 'miwo-layout-item'
		return


	configureComponent: (component) ->
		super(component)
		component.el.setStyles
			top: component.top
			bottom:  component.bottom
			left: component.left
			right: component.right
		return


	unconfigureComponent: (component) ->
		super(component)
		component.el.setStyles
			top: null
			bottom: null
			left: null
			right: null
		return


module.exports = AbsoluteLayout
