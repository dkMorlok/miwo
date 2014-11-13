var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var optimizeBrowserify = require('gulp-optimizebrowserify');
var less = require('gulp-less');
var minifycss = require('gulp-minify-css');
var sequence = require('run-sequence');


var paths = {
	css: {
		src: 'less/miwo.less',
		target: 'miwo.css',
		buildDir: './dist/'
	},
	js: {
		src: 'src/index.coffee',
		target: 'miwo.js',
		buildDir: './dist/'
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



gulp.task('default', ['build']);

gulp.task("watch", function() {
	gulp.start('build');
	gulp.watch(paths.watch.coffee, ['compile-js']);
	gulp.watch(paths.watch.less, ['compile-css']);
});

gulp.task('compile-css', function() {
	return gulp.src(paths.css.src)
		.pipe(pipes.createLess())
		.pipe(gulp.dest(paths.css.buildDir));
});

gulp.task('compile-js', function() {
	return gulp.src(paths.js.src, { read: false })
		.pipe(pipes.createBrowserify({transform: ['caching-coffeeify'], extensions: ['.coffee']}))
		.pipe(rename(paths.js.target))
		.pipe(gulp.dest(paths.js.buildDir));
});

gulp.task('minify-js', function() {
	return gulp.src(paths.js.buildDir+paths.js.target)
		.pipe(optimizeBrowserify())
		.pipe(uglify())
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest(paths.js.buildDir));
});

gulp.task('minify-css', function() {
	return gulp.src(paths.css.buildDir+paths.css.target)
		.pipe(minifycss({keepBreaks:true}))
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest(paths.css.buildDir));
});

gulp.task('build', function(cb) {
	sequence(['compile-js', 'compile-css'], cb);
});

gulp.task('dist', function(cb) {
	sequence('build', ['minify-js', 'minify-css'], cb);
});