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
	$.getJSON(url + '/posts/' + num + '/info.json', function() {
	}).done(function(data) {
		result.push(data);
		loadPostRecur(url, num + 1, result, done);
	}).fail(function(error) {
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

/**
 * Creates a post header from the info.json
 */
PostLoader.createPostHeader = function(postInfo) {
	var headerDiv = $('<div>');
	headerDiv.addClass('post-header');

	var titleDiv = $('<div>');
	titleDiv.addClass('post-title');
	titleDiv.html(postInfo.title);
	headerDiv.append(titleDiv);

	var authorDiv = $('<div>');
	authorDiv.addClass('post-author');
	authorDiv.html(postInfo.author);
	headerDiv.append(authorDiv);

	var dateDiv = $('<div>');
	dateDiv.addClass('post-date');
	dateDiv.html(postInfo.date);
	headerDiv.append(dateDiv);

	return headerDiv;
}