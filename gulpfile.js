var gulp = require('gulp'),
	rename = require('gulp-rename'),
	streamify = require('gulp-streamify'),
	argv = require('yargs').argv,
	less = require('gulp-less'),
	uglify = require('gulp-uglify'),
	minifyCSS = require('gulp-minify-css'),
	concat = require('gulp-concat'),
	spawn = require('child_process').spawn,
	autoprefixer = require('gulp-autoprefixer'),
	webServerNode, http = require('http'),
	pluginFileName = require('./package.json').name + '-' + require('./package.json').version;

gulp.task('watch', function () {
	gulp.watch('./src/plugin/less/**/*.less', ['plugin-less']);
	gulp.watch('./src/plugin/js/**/*.js', ['plugin-js']);
	gulp.watch('./src/example/less/**/*.less', ['example-less']);
	gulp.watch('./src/example/js/**/*.js', ['example-js']);
	gulp.watch('./src/example/html/**/*.html', ['example-html']);
	gulp.watch('./webserver.js', ['webserver']);
});

gulp.task('plugin-js', function () {
	gulp.src('./src/plugin/js/**/*.js')
		.pipe(concat(pluginFileName + '.js'))
		.pipe(gulp.dest('./build/'))
		.pipe(gulp.dest('./example/static/'))
		.pipe(rename(pluginFileName + '.min.js'))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest('./build/'))
		.pipe(gulp.dest('./example/static/'));
});
gulp.task('plugin-less', function () {
	gulp.src('./src/plugin/less/core.less')
		.pipe(less())
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(rename(pluginFileName + '.css'))
		.pipe(gulp.dest('./build/'))
		.pipe(gulp.dest('./example/static/'))
		.pipe(rename(pluginFileName + '.min.css'))
		.pipe(minifyCSS({
			keepSpecialComments: 1
		}))
		.pipe(gulp.dest('./build/'))
		.pipe(gulp.dest('./example/static/'));
});
gulp.task('example-html', function () {
	gulp.src('./src/example/html/**/*.html')
		.pipe(gulp.dest('./example/'));
});
gulp.task('example-js', function () {
	gulp.src('./src/example/js/**/*.js')
		.pipe(concat('init.js'))
		.pipe(gulp.dest('./example/static/'))
		.pipe(rename('init.min.js'))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest('./example/static/'));
});
gulp.task('example-less', function () {
	gulp.src('./src/example/less/core.less')
		.pipe(less())
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(rename('style.css'))
		.pipe(gulp.dest('./example/static/'))
		.pipe(rename('style.min.css'))
		.pipe(minifyCSS({
			keepSpecialComments: 1
		}))
		.pipe(gulp.dest('./example/static/'));
});
gulp.task('webserver', function () {
	if (webServerNode) webServerNode.kill();
	webServerNode = spawn('node', ['./webserver.js'], {
		stdio: 'inherit'
	});
});

var run = ['plugin-less', 'plugin-js', 'example-less', 'example-js', 'example-html', 'watch', 'webserver'];
process.on('exit', function () {
	if (webServerNode) webServerNode.kill();
});
process.on('SIGINT', function () {
	if (webServerNode) webServerNode.kill();
	process.exit();
});

gulp.task('default', run);