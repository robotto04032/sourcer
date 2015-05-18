var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var mocha = require('gulp-mocha');
var ts = require('gulp-typescript');

// for power-assert
require('espower-loader')({
    cwd: process.cwd(),
    pattern: 'js/test/**/*.js'
});

gulp.task('browserify', ['ts'], function() {
  return browserify({
      debug: true,
    })
    .add('./js/index.js')
    .bundle()
    .pipe(source('dist/bundle.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('mocha', ['ts'], function() {
  return gulp.src(['js/test/**/*.js'], { read: false })
    .pipe(mocha({ reporter: 'tap'}));
});

gulp.task('ts', function() {
  var project = ts.createProject(
    'ts/tsconfig.json',
    { typescript: require('typescript') });

  return project.src()
    .pipe(ts(project))
    .js.pipe(gulp.dest('js'));
});

gulp.task('default', ["browserify"]);
