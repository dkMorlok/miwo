require './core/Common'
require './core/Types'
require './core/Element'

# create loader
miwo = require './bootstrap/Miwo'
global.miwo = miwo

# create namespace
Miwo = {}
global.Miwo = Miwo

# register di extension
miwo.registerExtension('miwo', require './DiExtension')

# core
Miwo.core = require './core'
Miwo.Object = Miwo.core.Object
Miwo.Events = Miwo.core.Events

# components
Miwo.component = require './component'
Miwo.Component = Miwo.component.Component
Miwo.Container = Miwo.component.Container

# dependency injection
Miwo.di = require './di'

# http
Miwo.http = require './http'

# utils
Miwo.locale = require './locale'

# utils
Miwo.utils = require './utils'