Template = require ('./Template')

class TemplateFactory

	@inject: ['latteFactory', 'templateLoader']
	latteFactory: null
	templateLoader: null


	createTemplate: () ->
		template = new Template(@latteFactory.createLatte())
		template.setLoader(@templateLoader)
		return template


module.exports = TemplateFactory