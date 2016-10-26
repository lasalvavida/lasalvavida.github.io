'use strict';
var $ = require('jquery');
var Chart = require('chart.js');
var Vision = require('visionjs');

var VImage = Vision.Image;
var Kernel = Vision.Kernel;

var canvasOriginal = document.getElementById('post-three-canvas-original');
var canvasKernel = document.getElementById('post-three-canvas-kernel');
var canvasIntegral = document.getElementById('post-three-canvas-integral');
var canvasChart = document.getElementById('post-three-bar-chart');
var startButton = $('#post-three-start-button');
var contextOriginal = canvasOriginal.getContext('2d');
var contextKernel = canvasKernel.getContext('2d');
var contextIntegral = canvasIntegral.getContext('2d');
var contextChart = canvasChart.getContext('2d');

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
  context.lineWidth = 10;
  context.strokeStyle = '#FFFFFF'
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
  var size = parseInt($('#post-three-size-select').val());
  var kernel = Kernel.average(size, size);
  var halfSize = Math.floor(size / 2);
  originalImage.convolveAsync(kernel, convolveOptions, kernelImage)
    .then(function(result) {
      kernelLoading = false;
      result.writeRawData(kernelImageData.data);
      contextKernel.putImageData(kernelImageData, 0, 0);
      endTime = Date.now();
      $('#post-three-kernel-time').text((endTime - startTime) + ' ms');
      chartData.datasets[0].data[indexForValue[size]] = endTime - startTime;
      barChart.update();
    }).then(function() {
      integralLoading = true;
      drawIntegralLoading();
      var integralOptions = {
        chunk : true,
        iterations : 512,
        duration : 10
      };
      var args = [
        function(row, column, func, args, options, result) {
          var topRow = row - (halfSize + 1);
          var topColumn = column - (halfSize + 1);
          if (topRow < 0) {
            topRow = 0;
          }
          if (topColumn < 0) {
            topColumn = 0;
          }
          var bottomRow = row + halfSize;
          var bottomColumn = column + halfSize;
          if (bottomRow >= this.rows) {
            bottomRow = this.rows - 1;
          }
          if (bottomColumn >= this.columns) {
            bottomColumn = this.columns - 1;
          }
          var area = (bottomRow - topRow) * (bottomColumn - topColumn);
          result.set(row, column, (this.get(bottomRow, bottomColumn) -
            this.get(bottomRow, topColumn) -
            this.get(topRow, bottomColumn) +
            this.get(topRow, topColumn)) / area);
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
          chartData.datasets[1].data[indexForValue[size]] = endTime - startTime;
          barChart.update();
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

var chartData = {
  labels: [],
  datasets: [{
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    data: [],
    label: 'Kernel Convolution Average Filter'
  }, {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    data: [],
    label: 'Integral Image Average Filter'
  }]
};
var index = 0;
var indexForValue = {};
$('#post-three-size-select > option').each(function() {
  chartData.labels.push(this.text);
  chartData.datasets[0].data.push(0);
  chartData.datasets[1].data.push(0);
  indexForValue[this.value] = index;
  index++;
});
var barChart = new Chart(contextChart, {
  type: 'bar',
  data: chartData
});

var image = new Image();
image.addEventListener("load", function() {
  draw();
}, false);
image.src = 'images/Lenna.png';

startButton.on('click', convolve);
