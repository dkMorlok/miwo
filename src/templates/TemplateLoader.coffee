class TemplateLoader

	baseUrl: null
	templatesDir: null
	templatesExt: 'latte'


	load: (source) ->
		if source.indexOf('#') is 0
			return $(source.replace(/^\#/, '')).get('html')
		else if source.indexOf('path:') is 0
			return @loadFromPath(source.replace(/^path:/, ''))
		else if source.indexOf('//') is 0
			return @loadFromPath(source.replace(/^\/\//, ''))
		else
			return source


	loadFromPath: (path) ->
		url = @baseUrl+@templatesDir+'/'+path+'.'+@templatesExt
		source = ''
		request = new Request
			url: url+"?t="+(new Date().getTime())
			async: false
			onSuccess: (data) -> source = data
			onFailure: () -> throw new Error("Load template failure from url #{url}")
		request.send()
		return source


module.exports = TemplateLoader