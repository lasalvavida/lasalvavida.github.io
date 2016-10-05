'use strict';
var $ = require('jquery');
var Promise = require('bluebird');
var Vision = require('visionjs');
var defaults = require('defaults');

var Style = require('./Style');
var PostLoader = require('./PostLoader');

window.$ = window.jquery = $;
window.Vision = window.visionjs = Vision;
window.Promise = window.bluebird = Promise;

Promise.config({
  cancellation : true
});

var postServer = 'http://localhost:8080'
var Blog = {};

Blog.loadPosts = function() {
  var first = 0;
  var last = 1;
  var posts = PostLoader.loadPosts(postServer, first, last);
  postsLoaded(posts, first, last);
}

function postsLoaded(posts, first, last) {
  var postDivs = {};
  for (var i=last; i>=first; i--) {
    var post = posts[i];
    postLoaded(post, i);
  }
}

function postLoaded(post, num) {
  var postDiv = $('<div>');
  postDiv.attr('id', num);
  postDiv.addClass('post');
  $('#posts').append(postDiv);

  post.info.then(function(infoJSON) {
    postDiv.append(PostLoader.createPostHeader(infoJSON));
    return post.content;
  }).then(function(contentString) {
    postDiv.append(contentString);
  });
}

module.exports = Blog;
