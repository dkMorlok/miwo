var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var optimizeBrowserify = require('gulp-optimize-browserify');
var less = require('gulp-less');
var minifycss = require('gulp-minify-css');


var paths = {
	css: {
		src: 'less/miwo.less',
		buildDir: './dist/css/'
	},
	js: {
		src: 'src/index.coffee',
		buildDir: './dist/js/'
	},
	assets: {
		src: 'less/*.less',
		buildDir: './dist/less/'
	},
	watch: {
		coffee: ['src/**/*.coffee'],
		less: ['less/*.less']
	}
};


var pipes = {
	createBrowserify: function(options) {
		var pipe = browserify(options);
		pipe.on('error', gutil.log);
		return pipe;
	},
	createLess: function(options) {
		var pipe = less(options)
		pipe.on('error', gutil.log);
		return pipe;
	}
};



gulp.task('default', ['build', 'watch']);

gulp.task('build', ['compile-js', 'compile-css', 'copy-assets']);

gulp.task('dist', ['compile-js', 'compile-css', 'minify-js', 'minify-css', 'copy-assets']);

gulp.task("watch", function() {
	gulp.watch(paths.watch.coffee, ['compile-js']);
	gulp.watch(paths.watch.less, ['compile-css']);
});

gulp.task('compile-css', function() {
	return gulp.src(paths.css.src)
		.pipe(pipes.createLess())
		.pipe(rename('miwo.css'))
		.pipe(gulp.dest(paths.css.buildDir));
});

gulp.task('compile-js', function() {
	return gulp.src(paths.js.src, { read: false })
		.pipe(pipes.createBrowserify({transform: ['caching-coffeeify'], extensions: ['.coffee'], debug:true}))
		.pipe(rename('miwo.js'))
		.pipe(gulp.dest(paths.js.buildDir));
});

gulp.task('copy-assets', function() {
	return gulp.src(paths.assets.src)
		.pipe(gulp.dest(paths.assets.buildDir));
});

gulp.task('minify-css', function() {
	return gulp.src(paths.css.src)
		.pipe(pipes.createLess())
		.pipe(minifycss({keepBreaks:true}))
		.pipe(rename('miwo.min.css'))
		.pipe(gulp.dest(paths.css.buildDir));
});

gulp.task('minify-js', function() {
	return gulp.src(paths.js.src, { read: false })
		.pipe(pipes.createBrowserify({transform: ['caching-coffeeify'], extensions: ['.coffee']}))
		.pipe(optimizeBrowserify())
		.pipe(uglify())
		.pipe(rename('miwo.min.js'))
		.pipe(gulp.dest(paths.js.buildDir));
});