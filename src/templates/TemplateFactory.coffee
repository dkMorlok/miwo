MiwoObject = require '../core/Object'
Template = require './Template'


class TemplateFactory extends MiwoObject

	latteFactory: @inject('latteFactory')
	templateLoader: @inject('templateLoader')


	createTemplate: () ->
		template = new Template(@latteFactory.createLatte())
		template.setLoader(@templateLoader)
		return template


module.exports = TemplateFactory