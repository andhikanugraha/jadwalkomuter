var gulp = require('gulp');

var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var sass = require('gulp-sass');
var serve = require('gulp-serve');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');

var fetchTimetables = require('./fetchTimetables');
var buildHTML = require('./buildHTML');

gulp.task('sass', () => {
  return gulp.src('src/scss/*.scss')
    .pipe(sass({
      outputStyle: 'nexted',
      includePaths: ['node_modules']
    }))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('fetch', () => {
  return fetchTimetables();
});

gulp.task('html', () => {
  return buildHTML();
});

gulp.task('js', ['timetable', 'index'].map(fn => {
  gulp.task(`js:${fn}`, () =>
      browserify({
        entries: `src/js/${fn}.js`,
        debug: true
      })
      .transform(babelify)
      .bundle()
      .pipe(source(`${fn}.js`))
      .pipe(buffer())
      // .pipe(uglify())
      .pipe(gulp.dest('dist/js/')));
  return `js:${fn}`;
}));

gulp.task('clean:css', () => {
  return del(['dist/css']);
});

gulp.task('clean:js', () => {
  return del(['dist/js']);
});

gulp.task('clean:html', () => {
  return del(['dist/*/index.html']);
});

gulp.task('clean:json', () => {
  return del(['dist/*/index.json', 'dist/index.json']);
});

gulp.task('clean', () => {
  return del(['dist/**', 'dist', '!dist/.git']);
});

gulp.task('serve', serve('dist'));

gulp.task('build', ['sass', 'html', 'js']);