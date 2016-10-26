'use strict';
var Dropzone = require('dropzone');
var Vision = require('visionjs');

var Matrix2d = Vision.Matrix2d;
var Kernel = Vision.Kernel;
var SURF = Vision.SURF;
var VImage = Vision.Image;
var otsu = Vision.otsu;

var canvas = document.getElementById('post-five-canvas');
var button = $('#post-five-startbutton');
var slider = $('#post-five-slider');
var context = canvas.getContext('2d');
var imageData;
var loadingImageData;
var originalImage;
var modifiedImage;
var loading = false;
var startAngle = 0;
var matrix;
var threshold;

function drawLoading() {
  if (loading) {
    context.putImageData(loadingImageData, 0, 0);
    context.beginPath();
    context.arc(Math.floor(canvas.width/2), Math.floor(canvas.height/2), Math.min(canvas.width/5, canvas.height/5), startAngle, startAngle + Math.PI / 3);
    context.stroke();
    startAngle += Math.PI/16;
    if (startAngle > 2 * Math.PI) {
      startAngle = startAngle - 2 * Math.PI;
    }
    window.requestAnimationFrame(drawLoading);
  }
  return startAngle;
}

function draw() {
  var width = canvas.width;
  var height = canvas.height;
  context.drawImage(image, 0, 0, width, height);
  imageData = context.getImageData(0, 0, width, height);
  originalImage = VImage.fromRawData(width, height, imageData.data);

  if (!loading) {
    loading = true;
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, width, height);
    context.lineWidth = 10;
    context.strokeStyle = '#FFFFFF'
    loadingImageData = context.getImageData(0, 0, width, height);
    window.requestAnimationFrame(drawLoading);
  }

  var r = originalImage.channels[0];
  var g = originalImage.channels[1];
  var b = originalImage.channels[2];
  var gray = new Matrix2d(r.rows, r.columns);

  gray.apply(function(row, column) {
    this.set(row, column, Math.round((r.get(row, column) +
      g.get(row, column) +
      b.get(row, column)) / 3));
  });

  var integral = gray.integral();
  var options = {
    chunk : true,
    iterations : 512,
    duration : 10
  };

  SURF.hessianDeterminantAsync(integral, 0, 0, options)
    .then(function(result) {
      matrix = result;
      var histogram = matrix.histogram(256);
      threshold = otsu(histogram, matrix.length);

      var min = matrix.min();
      var max = matrix.max();

      slider.prop('min', '' + min);
      slider.prop('max', '' + max);
      slider.prop('value', '' + threshold);

      loading = false;
      drawThresholded();
  });
}

function drawThresholded() {
  if (originalImage) {
    originalImage.writeRawData(imageData.data);
    matrix.apply(function(row, column) {
      var value = Math.abs(this.get(row, column));
      var index = (matrix.columns * row + column) * 4;
      if (value > threshold) {
        imageData.data[index] = 0.0;
        imageData.data[index + 1] = 0.0;
        imageData.data[index + 2] = 0.0;
        imageData.data[index + 3] = 1.0;
      }
    });
    context.putImageData(imageData, 0, 0);
  }
}

var image;
function imageLoaded() {
  var width = canvas.width;
  var height = canvas.height;
  context.drawImage(image, 0, 0, width, height);
  button.click(draw);
  slider.on('mousemove change', function() {
    threshold = $(this).val();
    drawThresholded();
  });
}

image = new Image();
image.src = 'images/simple-shapes.png';
image.addEventListener('load', imageLoaded, false);

var dropzone = new Dropzone('form#post-five-dropzone', {
  accept: function(file, done) {
    var fr = new FileReader();
    fr.onload = function() {
      image.src = fr.result;
      done();
    }
    fr.readAsDataURL(file);
  },
  acceptedFiles: 'image/*',
  autoProcessQueue: false,
  maxFiles: 1,
  maxfilesexceeded: function(file) {
    this.removeAllFiles();
    this.addFile(file)
  },
  paramName: 'file'
});
