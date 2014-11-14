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
		url = @baseUrl + @templatesDir + '/' + path+'.' + @templatesExt + '?t=' + (new Date().getTime())
		return miwo.http.read(url)


module.exports = TemplateLoader