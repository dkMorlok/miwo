MiwoObject = require('../core/Object')


class ComponentManager extends MiwoObject

	list: null
	names: null
	id: 1


	constructor: () ->
		super()
		@list = {}
		@names = {}
		return


	uniqueId: ->
		@id++
		return "c" + @id


	uniqueName: (group) ->
		@names[group] = 0  unless @names[group]
		@names[group]++
		return group + @names[group]


	register: (comp) ->
		if comp.componentMgr then throw new Error("Component #{comp} with id #{comp.id} already exists.")
		comp.componentMgr = this
		@list[comp.id] = comp
		@emit("register", comp)
		return


	unregister: (comp) ->
		if @list[comp.id]
			delete @list[comp.id]
			delete comp.componentMgr
			@emit("unregister", comp)
		return


	beforeRender: (component) ->
		@emit("beforerender", component)
		return


	afterRender: (component) ->
		@emit("afterrender", component)
		return


	get: (id) ->
		return (if @list[id] then @list[id] else null)



module.exports = ComponentManager