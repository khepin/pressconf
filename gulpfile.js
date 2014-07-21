var gulp = require('gulp');
var concat = require('gulp-concat-sourcemap');
var livereload = require('gulp-livereload');

gulp.task('default', ['concat', 'concatlibs', 'copy', 'css', 'customcss'], function(){
	livereload.listen();
	gulp.watch(['static/src/**/*'], ['concat', 'copy', 'customcss']);
	gulp.watch(['static/src/bower_components/**/*.js'], ['concatlibs']);
	gulp.watch(['static/src/**/*']).on('change', livereload.changed);
});

gulp.task('concat', function() {
	return gulp.src([
		'static/src/js/**/*module.js',
		'static/src/js/**/*.js'
	]).pipe(concat('build.js'))
	.pipe(gulp.dest('static/build'));
});

gulp.task('concatlibs', function(){
	return gulp.src([
		'static/src/bower_components/lodash/dist/lodash.js',
		'static/src/bower_components/jquery/dist/jquery.js',
		'static/src/bower_components/angular/angular.js',
		'static/src/bower_components/angular-route/angular-route.js',
		'static/src/bower_components/restangular/dist/restangular.js'
	]).pipe(concat('libs.js'))
	.pipe(gulp.dest('static/build'));
})

gulp.task('copy', function(){
	return gulp.src('static/src/**/*.html')
		.pipe(gulp.dest('static/build'))
	;
});

gulp.task('css', function(){
	return gulp.src('static/src/bower_components/foundation/css/foundation.css')
		.pipe(gulp.dest('static/build'))
	;
});

gulp.task('customcss', function(){
	return gulp.src('static/src/css/*.css').pipe(gulp.dest('static/build'));
});