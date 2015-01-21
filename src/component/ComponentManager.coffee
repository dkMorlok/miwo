MiwoObject = require('../core/Object')


class ComponentManager extends MiwoObject

	list: null
	names: null
	roots: null
	id: 1


	constructor: () ->
		super()
		@list = {}
		@names = {}
		@roots = []
		return


	uniqueId: ->
		@id++
		return "c" + @id


	uniqueName: (group) ->
		@names[group] = 0  unless @names[group]
		@names[group]++
		return group + @names[group]


	register: (cmp) ->
		if cmp.componentMgr then throw new Error("Component #{comp} with id #{cmp.id} already exists.")
		cmp.componentMgr = this
		@list[cmp.id] = cmp
		@roots.include(cmp)
		cmp.on 'attached', (cmp) =>
			@roots.erase(cmp)
			return
		cmp.on 'detached', (cmp) =>
			@roots.include(cmp) if !cmp.destroying
			return
		@emit("register", cmp)
		return


	unregister: (cmp) ->
		if @roots.contains(cmp)
			@roots.erase(cmp)
		if @list[cmp.id]
			delete @list[cmp.id]
			delete cmp.componentMgr
			@emit("unregister", cmp)
		return


	beforeRender: (cmp) ->
		@emit("beforerender", cmp)
		return


	afterRender: (cmp) ->
		@emit("afterrender", cmp)
		return


	get: (id) ->
		return (if @list[id] then @list[id] else null)



module.exports = ComponentManager