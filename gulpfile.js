'use strict';

//Plugins
var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('uglify',function() {
    return gulp.src('index.js')
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('./'));
});

gulp.task('min',['uglify']);


