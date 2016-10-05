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

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return undefined;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Promise.config({
  cancellation : true
});

var postServer = 'http://localhost:8080';

function postsLoaded(posts, order) {
  for (var i = 0; i < order.length; i++) {
    var index = order[i];
    var post = posts[index];
    postLoaded(post, index);
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

var singlePost = parseInt(getParameterByName('singlePost'));
var posts;
var order = [];
if (singlePost !== undefined && singlePost !== '') {
  posts = PostLoader.loadPost(postServer, singlePost);
  order.push(singlePost);
} else {
  var first = 0;
  var last = 2;
  for(var i = last; i >= first; i--) {
    order.push(i);
  }
  posts = PostLoader.loadPosts(postServer, first, last);
}
postsLoaded(posts, order);
