describe("Locale.Translator", function() {

	var translator;

	before(function() {
		translator = new Miwo.locale.Translator();
		translator.setTranslates('en', 'app', {
			title: "Application Title",
			desc: "My demo application",
			empty: "",
			info: {
				name: "Username"
			}
		});
		translator.setTranslates('cs', 'app', {
			desc: "Moja demo aplikace",
			info: {
				name: "Uzivatel"
			}
		});
		translator.use('cs');
	});

	describe("#get(key)", function() {
		it("should get translate in current language", function () {
			expect(translator.get('app.desc')).to.equal('Moja demo aplikace');
		});

		it("should get translate in default language", function () {
			expect(translator.get('app.title')).to.equal('Application Title');
		});

		it("should get empty translate in default language", function () {
			expect(translator.get('app.empty')).to.equal('');
		});

		it("should get null for missing translate", function () {
			expect(translator.get('app.unknown')).to.equal('app.unknown');
		});

		it("should get null for unknown translate section", function () {
			expect(translator.get('unknown.title')).to.equal('unknown.title');
		});

		it("should get translate by path", function () {
			expect(translator.get('app.info.name')).to.equal("Uzivatel");
		});

		it("should change language and get translate", function () {
			translator.use('en');
			expect(translator.get('app.info.name')).to.equal("Username");
			translator.use('cs');
		});

		it("should override translates and get new translate", function () {
			translator.setTranslates('cs', 'app', {desc: "Updated desc"});
			expect(translator.get('app.desc')).to.equal("Updated desc");
		});

		it("should load remote translates", function () { // note: ajax cant load content
			/*var translator = new Miwo.locale.Translator();
			translator.setTranslates('en', 'app', JSON.decode(miwo.http.read('../data/locale.en.json')));
			translator.setTranslates('cs', 'app', JSON.decode(miwo.http.read('../data/locale.cs.json')));
			translator.use('cs');
			expect(translator.get('app.desc')).to.equal("Moja demo aplikace");*/
		});
	});

});