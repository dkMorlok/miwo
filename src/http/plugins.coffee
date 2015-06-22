class RedirectPlugin

	success: (request, payload) ->
		if request.type isnt 'json'
			return
		if payload.redirect
			document.location = payload.redirect
		return



class FailurePlugin

	failure: (request) ->
		miwo.flash.error(request.xhr.statusText + ": " + request.xhr.responseText.replace(/(<([^>]+)>)/g, ""))
		return



class ErrorPlugin

	error: (request, err) ->
		console.log("Error in ajax request", request, err)
		return



module.exports =

	RedirectPlugin: RedirectPlugin
	FailurePlugin: FailurePlugin
	ErrorPlugin: ErrorPlugin