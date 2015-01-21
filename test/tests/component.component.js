describe("Miwo.Component", function() {

	var container, viewport, navigation, item1, item2, item3, content, content2, grid, column;
	before(function() {
		container = new Miwo.Container();
		viewport = container.add('myViewport', new Miwo.Container({
			xtype: 'viewport',
			isViewport: true,
			title: 'Viewport Application',
			id: 'viewportId',
			index: 100
		}));

		navigation = viewport.add('navigation', new Miwo.Container({
			xtype: 'navigation',
			isNavigation: true,
			type: 'horizontal'
		}));
		item1 = navigation.add('item1', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 1'
		}));
		item2 = navigation.add('item2', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 2'
		}));
		item3 = navigation.add('item3', new Miwo.Component({
			xtype: 'navitem',
			title: 'Item 3'
		}));

		content = viewport.add('content', new Miwo.Container({
			xtype: 'panel'
		}));
		content2 = content.add('content', new Miwo.Container({
			xtype: 'panel'
		}));
		grid = content2.add('grid', new Miwo.Container({
			xtype: 'grid',
			title: 'Grid'
		}));
		column = grid.add('username', new Miwo.Component({
			xtype: 'column',
			label: 'Username'
		}));
	});

	after(function() {
		container.destroy();
	});


	describe("#getParent(selector = '*')", function() {
		it("should get (nested) parent container", function() {
			expect(item3.getParent()).to.equal(navigation);
		});

		it("should find parent container by xtype", function() {
			expect(item3.getParent('navigation')).to.equal(navigation);
		});

		it("should find parent container by xtype (not nested)", function() {
			expect(item3.getParent('viewport')).to.equal(viewport);
		});

		it("should find parent container by property exists", function() {
			expect(item3.getParent('[isViewport]')).to.equal(viewport);
		});

		it("should find parent container by property value", function() {
			expect(item3.getParent('[title=Viewport Application]')).to.equal(viewport);
		});

		it("should find parent container by property number value", function() {
			expect(item3.getParent('[index=100]')).to.equal(viewport);
		});

		it("should find parent container by id", function() {
			expect(item3.getParent('#viewportId')).to.equal(viewport);
		});

		it("should find parent container by name", function() {
			expect(item3.getParent('.myViewport')).to.equal(viewport);
		});

		it("should find parent container by id and attribute", function() {
			expect(item3.getParent('#viewportId[isViewport]')).to.equal(viewport);
		});

		it("should find parent container by name and attribute", function() {
			expect(item3.getParent('.myViewport[isViewport]')).to.equal(viewport);
		});

		it("should find parent container by properties", function() {
			expect(item3.getParent('[isNavigation][type=horizontal]')).to.equal(navigation);
		});

		it("should find parent container by xtype and property", function() {
			expect(item3.getParent('viewport[title=Viewport Application]')).to.equal(viewport);
		});

		it("should find parent container by xtype and properties", function() {
			expect(item3.getParent('viewport[isViewport][title=Viewport Application]')).to.equal(viewport);
		});

		it("should not find parent", function() {
			expect(column.getParent('unknown')).to.equal(null);
		});

		it("should find first parent of match", function() {
			expect(column.getParent('panel')).to.equal(content2);
		});
	});

});
