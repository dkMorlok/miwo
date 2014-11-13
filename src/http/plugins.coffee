class RedirectPlugin

	setManager:(manager) ->
		manager.on 'success', (request, response) ->
			if response.redirect
				document.location = response.redirect
		return


class FailurePlugin

	setManager:(manager) ->
		manager.on 'failure', (request) ->
			miwo.flash.error(request.xhr.statusText + ": " + request.xhr.responseText.replace(/(<([^>]+)>)/g, ""))
		return


class ErrorPlugin

	setManager:(manager) ->
		manager.on 'error', (request, text, error) ->
			console.error("Error in ajax request", request)
		return



module.exports =

	RedirectPlugin: RedirectPlugin
	FailurePlugin: FailurePlugin
	ErrorPlugin: ErrorPlugin