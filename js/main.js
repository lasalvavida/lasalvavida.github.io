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

var postServer = 'http://lasalvavida.github.io';

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
    var title = postDiv.find('.post-title');
    title.click(function() {
      window.location.href = 'index.html?singlePost=' + num;
    });
  });
}

$('.title').click(function() {
  window.location.href = 'index.html';
});

var singlePost = getParameterByName('singlePost');
var postsPerPage = getParameterByName('postsPerPage');
var page = getParameterByName('page');
var posts;
var order = [];

function makePrevPageButton(postsPerPage, page) {
  var prev = $('<div>');
  prev.addClass('right');
  prev.addClass('nav-item');
  prev.html('Previous Page &rarr;');
  prev.click(function() {
    window.location.href = 'index.html?postsPerPage=' + postsPerPage + '&page=' + (page + 1);
  });
  $('.nav-bar').append(prev);
}

function makeNextPageButton(postsPerPage, page) {
  var next = $('<div>');
  next.addClass('left');
  next.addClass('nav-item');
  next.html('&larr; Next Page');
  next.click(function() {
    window.location.href = 'index.html?postsPerPage=' + postsPerPage + '&page=' + (page - 1);
  });
  $('.nav-bar').append(next);
}

PostLoader.getManifest(postServer)
  .then(function(manifest) {
    var numPosts = manifest.numPosts;
    if (postsPerPage === undefined || postsPerPage === '') {
      postsPerPage = 3;
    } else {
      postsPerPage = parseInt(postsPerPage);
    }
    if (page === undefined || page === '') {
      page = 0;
    } else {
      page = parseInt(page);
    }
    if (singlePost !== undefined && singlePost !== '') {
      posts = PostLoader.loadPost(postServer, parseInt(singlePost));
      order.push(singlePost);
    } else {
      var last = (numPosts - 1) - page * postsPerPage;
      var first = last - postsPerPage + 1;
      if (first < 0) {
        first = 0;
      } else if (first >= numPosts) {
        first = numPosts - 1;
      }
      if (last < 0) {
        last = 0;
      } else if (last >= numPosts) {
        last = numPosts - 1;
      }
      if (first !== 0){
        makePrevPageButton(postsPerPage, page);
      }
      if (last !== numPosts - 1) {
        makeNextPageButton(postsPerPage, page);
      }
      for(var i = last; i >= first; i--) {
        order.push(i);
      }
      posts = PostLoader.loadPosts(postServer, first, last);
    }
    postsLoaded(posts, order);
});
