describe("miwo", function() {

	var container, viewport, navigation, item1, item2, item3;

	before(function() {
		container = new Miwo.Container();
		viewport = container.add('myViewport', new Miwo.Container({
			xtype: 'viewport',
			isViewport: true,
			title: 'Viewport Application',
			id: 'myViewport'
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
	});

	after(function(){
		container.destroy();
	});


	describe("#get(id)", function() {
		it("should get create component by id", function () {
			expect(miwo.get('myViewport')).to.equal(viewport);
		});

		it("should get null for bad id", function () {
			expect(miwo.get('unknown')).to.equal(null);
		});
	});

	describe("#query(selector)", function() {
		it("should find component", function () {
			expect(miwo.query('navigation')).to.equal(navigation);
		});

		it("should get first matched component", function () {
			expect(miwo.query('navitem')).to.equal(item1);
			expect(miwo.query('navitem[type=normal]')).to.equal(item1);
		});
	});

	describe("#queryAll(selector)", function() {
		it("should find all matched components", function () {
			var items = miwo.queryAll('navitem[type=normal]');
			expect(items.length).to.equal(2);
			expect(items[0]).to.equal(item1);
			expect(items[1]).to.equal(item2);
		});

		it("should get empty array if any component don't match", function () {
			var items = miwo.queryAll('navitem[type=unknown]');
			expect(items.length).to.equal(0);
		});
	});

});