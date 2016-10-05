'use strict';
var $ = require('jquery');
var Promise = require('bluebird');
var defined = require('defined');

var PostLoader = {
	manifest : undefined,
	postInfoCache : {},
	postContentCache : {}
};

PostLoader.getManifest = function(url) {
	if (defined(PostLoader.manifest)) {
		return Promise.resolve(PostLoader.manifest);
	} else {
		return $.getJSON(url + '/posts/manifest.json')
			.then(function(manifestJSON) {
				PostLoader.manifest = manifestJSON;
				return manifestJSON;
			});
	}
}

PostLoader.getPostInfo = function(url, postNum) {
	var cachedInfo = PostLoader.postInfoCache['' + postNum];
	if (defined(cachedInfo)) {
		return Promise.resolve(cachedInfo);
	} else {
		return $.getJSON(url + '/posts/' + postNum + '/info.json')
			.then(function(infoJSON) {
				PostLoader.postInfoCache['' + postNum] = infoJSON;
				return infoJSON;
			});
	}
}

PostLoader.getPostContent = function(url, postNum) {
	var cachedContent = PostLoader.postContentCache['' + postNum];
	if (defined(cachedContent)) {
		return Promise.resolve(cachedContent);
	} else {
		return $.get(url + '/posts/' + postNum + '/content.html')
			.then(function(contentString) {
				contentString = contentString.replace(/\$\{LOCAL\_PATH\}/g, url + '/posts/' + postNum);
				PostLoader.postContentCache['' + postNum] = contentString;
				return contentString;
			})
	}
}

PostLoader.loadPosts = function(url, first, last) {
	var promises = {};
	for (var i = first; i <= last; i++) {
		promises[i] = {
			info : PostLoader.getPostInfo(url, i),
			content : PostLoader.getPostContent(url, i)
		};
	}
	return promises;
}

PostLoader.loadPost = function(url, post) {
	var promises = {};
	promises[post] = {
		info : PostLoader.getPostInfo(url, post),
		content : PostLoader.getPostContent(url, post)
	};
	return promises;
}

PostLoader.createPostHeader = function(postInfo) {
	var headerDiv = $('<div>');
	headerDiv.addClass('post-header');

	var titleDiv = $('<div>');
	titleDiv.addClass('post-title');
	titleDiv.html(postInfo.title);
	headerDiv.append(titleDiv);

	var dateDiv = $('<div>');
	dateDiv.addClass('post-date');
	dateDiv.html(postInfo.date);
	headerDiv.append(dateDiv);

	return headerDiv;
}

module.exports = PostLoader;
