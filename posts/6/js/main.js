'use strict';
var $ = require('jquery');
var Three = require('three');
var Vision = require('visionjs');

var OrbitControls = require('./OrbitControl');

var Matrix2d = Vision.Matrix2d;
var Kernel = Vision.Kernel;
var SURF = Vision.SURF;
var VImage = Vision.Image;
var otsu = Vision.otsu;

var canvas = document.getElementById('post-six-canvas');
var canvas2d = document.getElementById('post-six-canvas-2d');
var context = canvas2d.getContext('2d');
var width = 500;
var height = 250;

var renderer;
var fullscreen = false;
var postSixCanvas = $("#post-six-canvas");
$('#post-six-toggle-fullscreen').click(function() {
  if (renderer) {
    if (fullscreen) {
      postSixCanvas.css({position:'relative'});
      postSixCanvas.width(width);
      postSixCanvas.height(height);
      renderer.setSize(width, height);
      fullscreen = false;
    } else {
      postSixCanvas.css({position:'fixed'});
      postSixCanvas.width(window.innerWidth);
      postSixCanvas.height(window.innerHeight);
      renderer.setSize(window.innerWidth, window.innerHeight);
      fullscreen = true;
    }
  }
});

var image;
function imageLoaded() {
  var width2d = canvas2d.width;
  var height2d = canvas2d.height;
  context.drawImage(image, 0, 0, width2d, height2d);
  var imageData = context.getImageData(0, 0, width2d, height2d);
  var originalImage = VImage.fromRawData(width2d, height2d, imageData.data);

  var scene = new Three.Scene();
  var camera = new Three.PerspectiveCamera(75, width/height, 0.1, 1000);
  renderer = new Three.WebGLRenderer();
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff);
  renderer.render(scene, camera);
  canvas.appendChild(renderer.domElement);
  var light = new Three.PointLight(0xffffff);
  light.position.set(100,200,100);
  scene.add(light);
  light = new Three.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 0, 0);
  scene.add(light);
  light = new Three.AmbientLight(0x404040);
  scene.add(light);

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

  var matrix;
  SURF.hessianDeterminantAsync(integral, 0, 0, options)
    .then(function(result) {
      matrix = result;
      var min = matrix.min();
      var max = matrix.max();
      matrix.apply(function(row, column) {
        var value = Math.round((matrix.get(row, column) - min)/(max - min) * 255);
        matrix.set(row, column, value);
      });

      var geometry = new Three.Geometry();
      matrix.apply(function(row, column) {
        geometry.vertices.push(new Three.Vector3(row, column, matrix.get(row, column)));
      });

      for (var row = 0; row < matrix.rows - 1; row++) {
        for (var column = 0; column < matrix.columns - 1; column++) {
          var face = new Three.Face3(row * matrix.columns + column,
            row * matrix.columns + column + 1,
            (row + 1) * matrix.columns + column
          );
          face.vertexColors[0] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row, column) + ',' +
            originalImage.channels[1].get(row, column) + ',' +
            originalImage.channels[2].get(row, column) + ');'
          );
          face.vertexColors[1] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row, column + 1) + ',' +
            originalImage.channels[1].get(row, column + 1) + ',' +
            originalImage.channels[2].get(row, column + 1) + ');'
          );
          face.vertexColors[2] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row + 1, column) + ',' +
            originalImage.channels[1].get(row + 1, column) + ',' +
            originalImage.channels[2].get(row + 1, column) + ');'
          );
          geometry.faces.push(face);
          face = new Three.Face3(row * matrix.columns + column + 1,
            (row + 1) * matrix.columns + column + 1,
            (row + 1) * matrix.columns + column
          );
          face.vertexColors[0] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row, column + 1) + ',' +
            originalImage.channels[1].get(row, column + 1) + ',' +
            originalImage.channels[2].get(row, column + 1) + ');'
          );
          face.vertexColors[1] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row + 1, column + 1) + ',' +
            originalImage.channels[1].get(row + 1, column + 1) + ',' +
            originalImage.channels[2].get(row + 1, column + 1) + ');'
          );
          face.vertexColors[2] = new Three.Color('rgb(' +
            originalImage.channels[0].get(row + 1, column) + ',' +
            originalImage.channels[1].get(row + 1, column) + ',' +
            originalImage.channels[2].get(row + 1, column) + ');'
          );
          geometry.faces.push(face);
        }
      }

      geometry.computeBoundingSphere();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      var material = new Three.MeshPhongMaterial({vertexColors: Three.VertexColors, side:Three.DoubleSide});
      var mesh = new Three.Mesh(geometry, material);
      scene.add(mesh);

      camera.position.set(300, 300, 300);
      camera.up = new Three.Vector3(0,0,1);
      camera.lookAt(new Three.Vector3(125, 125, 0));
      var controls = new Three.OrbitControls(camera, renderer.domElement);
      var render = function() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
      };
      render();
  });
}

image = new Image();
image.src = 'images/Lenna.png';
image.addEventListener('load', imageLoaded, false);
