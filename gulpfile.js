'use strict';
var Promise = require('bluebird');
var fs = require('fs-extra');
var gulp = require('gulp');
var webpack = require('webpack-stream');

var fsReadFile = Promise.promisify(fs.readFile);
var fsReaddir = Promise.promisify(fs.readdir);
var fsWriteFile = Promise.promisify(fs.writeFile);

gulp.task('build', function() {
  var postPath = './posts';
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
                  jquery: '$',
                  visionjs: 'Vision',
                  bluebird: 'Promise'
                }
              }))
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
