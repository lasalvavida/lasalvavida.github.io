/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $ = __webpack_require__(1);
	var Vision = __webpack_require__(2);

	var VImage = Vision.Image;
	var Kernel = Vision.Kernel;

	var canvasOriginal = document.getElementById('post-one-canvas-original');
	var canvasModified = document.getElementById('post-one-canvas-modified');
	var contextOriginal = canvasOriginal.getContext('2d');
	var contextModified = canvasModified.getContext('2d');
	var originalImage;
	var modifiedImage;
	var imageData;
	var kernel;

	function cellChanged() {
	  var cell = $(this);
	  var row = cell.data('row');
	  var column = cell.data('column');
	  kernel.set(row, column, parseFloat(cell.val()));
	  return redraw();
	}

	function initKernel() {
	  var name = $('#post-one-kernel-select').val();
	  var rows = parseInt($('#post-one-kernel-rows').val());
	  var columns = parseInt($('#post-one-kernel-columns').val());
	  kernel = Kernel.fromName(name, rows, columns);

	  var kernelDiv = $('#post-one-kernel');
	  kernelDiv.empty();
	  for (var i = 0; i < kernel.rows; i++) {
	    var rowDiv = $('<div>');
	    kernelDiv.append(rowDiv);
	    for (var j = 0; j < kernel.columns; j++) {
	      var cell = $('<input>');
	      cell.addClass('mat-cell');
	      cell.attr('id', 'post-one-cell' + i + '-' + j);
	      cell.attr('type', 'number');
	      cell.data('row', i);
	      cell.data('column', j);
	      cell.val(kernel.get(i, j));
	      cell.change(cellChanged);
	      rowDiv.append(cell);
	    }
	  }
	  return redraw();
	}

	function bindUi() {
	  $('#post-one-kernel-select').change(initKernel);
	  $('#post-one-kernel-rows').change(initKernel);
	  $('#post-one-kernel-columns').change(initKernel);
	}

	var loading = false;
	var startAngle = 0;
	var loadingImageData;
	function drawLoading() {
	  if (loading) {
	    contextModified.putImageData(loadingImageData, 0, 0);
	    contextModified.beginPath();
	    contextModified.arc(Math.floor(canvasModified.width/2), Math.floor(canvasModified.height/2), Math.min(canvasModified.width/5, canvasModified.height/5), startAngle, startAngle + Math.PI / 3);
	    contextModified.stroke();
	    startAngle += Math.PI/16;
	    if (startAngle > 2 * Math.PI) {
	      startAngle = startAngle - 2 * Math.PI;
	    }
	    window.requestAnimationFrame(drawLoading);
	  }
	}

	function draw() {
	  contextOriginal.drawImage(image, 0, 0, canvasOriginal.width, canvasOriginal.height);
	  contextModified.drawImage(image, 0, 0, canvasModified.width, canvasModified.height);
	  var width = canvasOriginal.width;
	  var height = canvasOriginal.height;
	  imageData = contextOriginal.getImageData(0, 0, width, height);
	  originalImage = VImage.fromRawData(width, height, imageData.data);
	  modifiedImage = new VImage(width, height);
	  bindUi();
	  initKernel();
	}

	var drawPromise;
	function redraw() {
	  var width = canvasModified.width;
	  var height = canvasModified.height;
	  if (drawPromise !== undefined) {
	    drawPromise.cancel();
	  }
	  if (!loading) {
	    loading = true;
	    contextModified.fillStyle = 'rgba(0, 0, 0, 0.5)';
	    contextModified.fillRect(0, 0, width, height);
	    contextModified.lineWidth = 10;
	    contextModified.strokeStyle = '#FFFFFF'
	    loadingImageData = contextModified.getImageData(0, 0, width, height);
	    window.requestAnimationFrame(drawLoading);
	  }
	  drawPromise =  originalImage.convolveAsync(kernel, {
	    iterations : 512,
	    duration : 10,
	    chunk : true
	  }, modifiedImage).then(function(result) {
	    loading = false;
	    var channels = modifiedImage.channels;
	    for (var n = 0; n < channels.length; n++) {
	      var channel = channels[n];
	      var min = channel.min();
	      var max = channel.max();
	      if (min < 0 || max > 255) {
	        channel.apply(function(row, column) {
	          this.set(row, column, Math.floor(this.get(row, column) - min) / (max - min) * 255);
	        });
	      }
	    }
	    modifiedImage.writeRawData(imageData.data);
	    contextModified.putImageData(imageData, 0, 0);
	  });
	  return drawPromise;
	}

	var image = new Image();
	image.addEventListener("load", function() {
	  draw();
	}, false);
	image.src = 'images/Lenna.png';


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = $;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = Vision;

/***/ }
/******/ ]);