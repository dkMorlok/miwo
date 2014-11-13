require './core/Types'
require './core/Element'

# create namespace
Miwo = {version: "0.1.0"}
if global.module then module.exports = Miwo
global.Miwo = Miwo
global.miwo = require './bootstrap/Miwo'

# core
Miwo.core = require './core'
Miwo.Object = Miwo.core.Object
Miwo.Events = Miwo.core.Events

# components
Miwo.component = require './component'
Miwo.Component = Miwo.component.Component
Miwo.Container = Miwo.component.Container

# application
Miwo.app = require './app'
Miwo.Controller = Miwo.app.Controller

# dependency injection
Miwo.di = require './di'
Miwo.InjectorExtension = Miwo.di.InjectorExtension

# data
Miwo.data = require './data'
Miwo.Store = Miwo.data.Store
Miwo.Record = Miwo.data.Record
Miwo.Entity = Miwo.data.Entity
Miwo.Proxy = Miwo.data.Proxy

# http
Miwo.http = require './http'

# utils
Miwo.utils = require './utils'
