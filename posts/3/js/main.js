'use strict';
var $ = require('jquery');
var Vision = require('visionjs');

var VImage = Vision.Image;
var Kernel = Vision.Kernel;

var canvasOriginal = document.getElementById('post-three-canvas-original');
var canvasKernel = document.getElementById('post-three-canvas-kernel');
var canvasIntegral = document.getElementById('post-three-canvas-integral');
var startButton = $('#post-three-start-button');
var contextOriginal = canvasOriginal.getContext('2d');
var contextKernel = canvasKernel.getContext('2d');
var contextIntegral = canvasIntegral.getContext('2d');

var imageData;
var kernelImageData;
var integralImageData;
var originalImage;
var kernelImage;
var cachedIntegralImage;
var integralImage;
var kernelLoading = false;
var integralLoading = false;

function fillBackground(context, canvas) {
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "gray";
  context.fill();
}

function drawLoading(context, canvas, startAngle, continueFunction) {
  fillBackground(context, canvas);
  context.beginPath();
  context.arc(Math.floor(canvas.width/2), Math.floor(canvas.height/2), Math.min(canvas.width/5, canvas.height/5), startAngle, startAngle + Math.PI / 3);
  context.stroke();
  startAngle += Math.PI/16;
  if (startAngle > 2 * Math.PI) {
    startAngle = startAngle - 2 * Math.PI;
  }
  window.requestAnimationFrame(continueFunction);
  return startAngle;
}

var kernelStartAngle = 0;
function drawKernelLoading() {
  if (kernelLoading) {
    kernelStartAngle = drawLoading(contextKernel, canvasKernel, kernelStartAngle, drawKernelLoading);
  }
}

var integralStartAngle = 0;
function drawIntegralLoading() {
  if (integralLoading) {
    integralStartAngle = drawLoading(contextIntegral, canvasIntegral, integralStartAngle, drawIntegralLoading);
  }
}

function convolve() {
  var kernel = Kernel.average(3, 3);
  kernelLoading = true;
  drawKernelLoading();
  var convolveOptions = {
    chunk : true,
    iterations : 512,
    duration : 10
  };
  var startTime;
  var endTime;
  startTime = Date.now();
  originalImage.convolveAsync(kernel, convolveOptions, kernelImage)
    .then(function(result) {
      kernelLoading = false;
      result.writeRawData(kernelImageData.data);
      contextKernel.putImageData(kernelImageData, 0, 0);
      endTime = Date.now();
      $('#post-three-kernel-time').text((endTime - startTime) + ' ms');
    }).then(function() {
      integralLoading = true;
      drawIntegralLoading();
      var integralOptions = {
        chunk : true,
        iterations : 512,
        duration : 10,
        edge : 'zero'
      };
      var args = [
        function(i, j, func, args, options, result) {
          result.set(i, j, (this.get(i+1, j+1, options) -
            this.get(i-2, j+1, options) -
            this.get(i+1, j-2, options) +
            this.get(i-2, j-2, options)) / 9.0);
        },
        undefined,
        integralOptions
      ];
      args[1] = args;
      startTime = Date.now();
      cachedIntegralImage.applyAsync('applyAsync', args, integralImage)
        .then(function(result) {
          integralLoading = false;
          result.writeRawData(integralImageData.data);
          contextIntegral.putImageData(integralImageData, 0, 0);
          endTime = Date.now();
          $('#post-three-integral-time').text((endTime - startTime) + ' ms');
        });
    });
}

function draw() {
  var width = canvasOriginal.width;
  var height = canvasOriginal.height;
  contextOriginal.drawImage(image, 0, 0, width, height);
  fillBackground(contextKernel, canvasKernel);
  fillBackground(contextIntegral, canvasIntegral);

  imageData = contextOriginal.getImageData(0, 0, width, height);
  originalImage = VImage.fromRawData(width, height, imageData.data);
  cachedIntegralImage = originalImage.integral();
  kernelImage = new VImage(width, height);
  integralImage = new VImage(width, height);
  kernelImageData = contextKernel.getImageData(0, 0, width, height);
  integralImageData = contextIntegral.getImageData(0, 0, width, height);
}

var image = new Image();
image.addEventListener("load", function() {
  draw();
}, false);
image.src = 'images/Lenna.png';

startButton.on('click', convolve);
