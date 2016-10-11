'use strict';
var Promise = require('bluebird');
var fs = require('fs-extra');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');

var fsReadFile = Promise.promisify(fs.readFile);
var fsReaddir = Promise.promisify(fs.readdir);
var fsWriteFile = Promise.promisify(fs.writeFile);

gulp.task('build', function() {
  var postPath = './posts';
  gulp.src('./js/main.js')
    .pipe(webpack({
      output : {
        filename : 'bundle.js'
      }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./js/build/'));
  return fsReaddir(postPath)
    .then(function(fileNames) {
      return Promise.map(fileNames, function(fileName) {
        var mainJsPath = postPath + '/' + fileName + '/js/main.js';
        var buildJsPath = postPath + '/' + fileName + '/js/build/';
        return fsReadFile(mainJsPath)
          .then(function() {
            return gulp.src(mainJsPath)
              .pipe(webpack({
                output : {
                  filename : 'bundle.js'
                },
                externals : {
                  bluebird: 'Promise',
                  'chart.js' : 'Chart',
                  jquery: '$',
                  visionjs: 'Vision',
                }
              }))
              .pipe(uglify())
              .pipe(gulp.dest(buildJsPath));
          })
          .catch(function(err) {
            // File doesn't exist, do nothing.
          });
      }).then(function() {
        return fileNames.length;
      });
    })
    .then(function(numFiles) {
      var manifest = {
        numPosts : numFiles - 1
      };
      return fsWriteFile('./posts/manifest.json', JSON.stringify(manifest));
    });
});
