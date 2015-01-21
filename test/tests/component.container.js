describe("Miwo.Container", function() {

	var container, viewport, navigation, item1, item2, item3, content, content2, grid, column;
	before(function(){
		container = new Miwo.Container();
		viewport = container.add('myViewport', new Miwo.Container({
			xtype: 'viewport',
			isViewport: true,
			title: 'Viewport Application',
			id: 'viewportId'
		}));

		navigation = viewport.add('navigation', new Miwo.Container({
			xtype: 'navigation',
			isNavigation: true,
			type: 'horizontal'
		}));
		item1 = navigation.add('item1', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 1',
			type: 'normal'
		}));
		item2 = navigation.add('item2', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 2',
			type: 'normal'
		}));
		item3 = navigation.add('item3', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 3',
			type: 'primary'
		}));

		content = viewport.add('content', new Miwo.Container({
			xtype: 'panel'
		}));
		content2 = content.add('content', new Miwo.Container({
			xtype: 'panel',
			id: 'gridPanel'
		}));
		grid = content2.add('grid', new Miwo.Container({
			xtype: 'grid',
			title: 'Grid'
		}));
		column = grid.add('username', new Miwo.Component({
			xtype: 'column',
			label: 'Username',
			id: 'usernameColumn'
		}));
	});

	after(function() {
		container.destroy();
	});


	describe("#child(selector = '*')", function() {
		it("should find first nested child", function () {
			expect(viewport.child()).to.equal(navigation);
		});
		it("should find nested child", function () {
			expect(viewport.child('navigation')).to.equal(navigation);
		});
		it("should not find nested child", function () {
			expect(viewport.child('unknown')).to.equal(null);
		});
	});

	describe("#find(selector = '*')", function() {
		it("should find nested child", function () {
			expect(viewport.find('>')).to.equal(navigation);
		});

		it("should find nested child by name", function () {
			expect(viewport.find('> .content')).to.equal(content);
		});

		it("should find nested child by xtype", function () {
			expect(viewport.find('> panel')).to.equal(content);
		});

		it("should find first nested child", function () {
			expect(viewport.find('*')).to.equal(navigation);
		});

		it("should find component by xtype", function () {
			expect(viewport.find('column')).to.equal(column);
		});

		it("should find component by property", function () {
			expect(viewport.find('[label=Username]')).to.equal(column);
		});

		it("should find component by id", function () {
			expect(viewport.find('#usernameColumn')).to.equal(column);
		});

		it("should find component by name", function () {
			expect(viewport.find('.username')).to.equal(column);
		});

		it("should find component by combine xtype and name", function () {
			expect(viewport.find('grid .username')).to.equal(column);
		});

		it("should find component by combine xtype any property", function () {
			expect(viewport.find('column[label=Username]')).to.equal(column);
		});

		it("should find component by combine xtypes", function () {
			expect(viewport.find('grid column')).to.equal(column);
		});

		it("should find component by combine xtypes and property", function () {
			expect(viewport.find('grid column[label=Username]')).to.equal(column);
		});

		it("should find first matched component by xtype", function () {
			expect(viewport.find('panel')).to.equal(content);
		});

		it("should find nested child in nested child", function () {
			expect(viewport.find('> panel grid > column')).to.equal(column);
		});

		it("should not find any component by xtype", function () {
			expect(viewport.find('input')).to.equal(null);
		});
	});

	describe("#findAll(selector = '*')", function() {
		it("should find component by xtype", function () {
			var items = viewport.findAll('column');
			expect(items.length).to.equal(1);
			expect(items[0]).to.equal(column);
		});

		it("should find components by xtype", function () {
			var items = viewport.findAll('navitem');
			expect(items.length).to.equal(3);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
			expect(items[2]).to.equal(item3);
		});

		it("should find components by xtypes", function () {
			var items = viewport.findAll('navigation navitem');
			expect(items.length).to.equal(3);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
			expect(items[2]).to.equal(item3);
		});

		it("should find components by xtypes (nested)", function () {
			var items = viewport.findAll('navigation > navitem');
			expect(items.length).to.equal(3);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
			expect(items[2]).to.equal(item3);
		});

		it("should find components by id", function () {
			var items = viewport.findAll('#usernameColumn');
			expect(items.length).to.equal(1);
			expect(items[0]).to.equal(column);
		});

		it("should find components by xtype and id", function () {
			var items = viewport.findAll('grid #usernameColumn');
			expect(items.length).to.equal(1);
			expect(items[0]).to.equal(column);
		});

		it("should not find components by xtype and id", function () {
			var items = viewport.findAll('grid #unknown');
			expect(items.length).to.equal(0);
		});

		it("should find components by xtype and property", function () {
			var items = viewport.findAll('navitem[type=normal]');
			expect(items.length).to.equal(2);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
		});

		it("should find all components", function () {
			var items = viewport.findAll('#gridPanel *');
			expect(items.length).to.equal(2);
			expect(items[0]).to.equal(grid);
			expect(items[1]).to.equal(column);
		});

		it("should find all nested components", function () {
			var items = viewport.findAll('#gridPanel > *');
			expect(items.length).to.equal(1);
			expect(items[0]).to.equal(grid);
		});

		it("should find components by xtype with coma separator", function () {
			var items = viewport.findAll('navitem,column');
			expect(items.length).to.equal(4);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
			expect(items[2]).to.equal(item3);
			expect(items[3]).to.equal(column);
		});

		it("should find components by xtype with coma separator (1 times)", function () {
			var items = viewport.findAll('grid navitem,column');
			expect(items.length).to.equal(1);
			expect(items[0]).to.equal(column);
		});

		it("should find components by xtype with coma separator (2 times)", function () {
			var items = viewport.findAll('grid,navigation navitem,column');
			expect(items.length).to.equal(4);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
			expect(items[2]).to.equal(item3);
			expect(items[3]).to.equal(column);
		});
	});

});
