'use strict';
var Promise = require('bluebird');
var defined = require('defined');
var fs = require('fs-extra');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');

var argv = require('yargs').argv;

var fsReadFile = Promise.promisify(fs.readFile);
var fsReaddir = Promise.promisify(fs.readdir);
var fsWriteFile = Promise.promisify(fs.writeFile);

function buildPost(postPath, fileName) {
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
            'chart.js': 'Chart',
            dropzone: 'Dropzone',
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
}

gulp.task('build', function() {
  var postPath = './posts';
  var singlePost = argv.single;
  if (!defined(singlePost)) {
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
          return buildPost(postPath, fileName);
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
  } else {
    return buildPost(postPath, singlePost);
  }
});
