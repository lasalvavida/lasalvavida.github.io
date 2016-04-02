/**
 * Loads post metadata, returns an array of the info.json data from
 * each post in the url given.
 *
 * Each post is expected to be sandboxed in its own folder within the
 * provided path.
 *
 * Calls the done callback provided once all of the posts are loaded
 */
var PostLoader = PostLoader || {};

PostLoader.loadAllPosts = function(url, done) {
	var num = 0;
	var result = [];
	loadPostRecur(url, num, result, done);
}

/**
 * Loads this post by number then gets the next one.
 * Calls done with the post metadata when done
 */
function loadPostRecur(url, num, result, done) {
	$.getJSON(url + '/posts/' + num + '/info.json', function(data) {
		result.push(data);
		loadPostRecur(url, num + 1, result, done);
	}).error(function() {
		done(result);
	});
}

/**
 * Returns content.html for a particular post number.
 *
 * Calls the done callback provided with the html
 */
PostLoader.getPostHTML = function(url, postNum, done) {
	$.get(url + '/posts/' + postNum + '/content.html', function(data) {
		done(postNum, data);
	});
}