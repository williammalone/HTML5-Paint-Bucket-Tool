// Copyright 2010 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*jslint browser: true */
/*global G_vmlCanvasManager, $ */

var paintBucketApp = (function () {

	"use strict";

	var canvas,
		context,
		canvasWidth = 490,
		canvasHeight = 220,
		colorPurple = {
			r: 203,
			g: 53,
			b: 148
		},
		colorGreen = {
			r: 101,
			g: 155,
			b: 65
		},
		colorYellow = {
			r: 255,
			g: 207,
			b: 51
		},
		colorBrown = {
			r: 152,
			g: 105,
			b: 40
		},
		color = [colorPurple, colorGreen, colorYellow, colorBrown],
		curColorIndex = 0,
		curColor = colorPurple,
		outlineImage = new Image(),
		paintImage = new Image(),
		backgroundImage = new Image(),
		clickX = [],
		clickY = [],
		clickColor = [],
		clickTool = [],
		clickSize = [],
		clickDrag = [],
		paint = false,
		curTool = "crayon",
		curSize = "normal",
		mediumStartX = 18,
		mediumStartY = 19,
		mediumImageWidth = 93,
		mediumImageHeight = 46,
		drawingAreaX = 111,
		drawingAreaY = 11,
		drawingAreaWidth = 267,
		drawingAreaHeight = 200,
		outlineLayerData,
		colorLayerData,
		pixelStack = [],
		newColorR,
		newColorG,
		newColorB,
		clickedColorR,
		clickedColorG,
		clickedColorB,
		totalLoadResources = 3,
		curLoadResNum = 0,

		// Clears the canvas.
		clearCanvas = function () {

			context.clearRect(0, 0, canvasWidth, canvasHeight);
		},

		// Redraws the canvas.
		redraw = function () {

			var locX = 52,
				locY;

			// Make sure required resources are loaded before redrawing
			if (curLoadResNum < totalLoadResources) {
				return;
			}

			clearCanvas();

			if (colorLayerData) {
				context.putImageData(colorLayerData, 0, 0);
				colorLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
			}

			context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

			// Purple
			locY = 19;

			context.beginPath();
			context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
			context.closePath();
			context.fillStyle = "rgb(" + colorPurple.r + "," + colorPurple.g + "," + colorPurple.b + ")";
			context.fill();

			if (curColorIndex === 0) {
				context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);

			} else {
				context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
			}

			// Green
			locY += 46;

			context.beginPath();
			context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
			context.fillStyle = "rgb(" + colorGreen.r + "," + colorGreen.g + "," + colorGreen.b + ")";
			context.fill();

			if (curColorIndex === 1) {
				context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);

			} else {
				context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
			}

			// Yellow
			locY += 46;

			context.beginPath();
			context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
			context.fillStyle = "rgb(" + colorYellow.r + "," + colorYellow.g + "," + colorYellow.b + ")";
			context.fill();

			if (curColorIndex === 2) {
				context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);
			} else {
				context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
			}

			// Yellow
			locY += 46;

			context.beginPath();
			context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
			context.fillStyle = "rgb(" + colorBrown.r + "," + colorBrown.g + "," + colorBrown.b + ")";
			context.fill();

			if (curColorIndex === 3) {
				context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);

			} else {
				context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
			}

			// Draw the outline image
			context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
		},

		// Adds a point to the drawing array.
		// @param x
		// @param y
		// @param dragging
		addClick = function (x, y, dragging) {

			clickX.push(x);
			clickY.push(y);
			clickTool.push(curTool);
			clickColor.push(curColor);
			clickSize.push(curSize);
			clickDrag.push(dragging);
		},

		matchClickedColor = function (pixelPos) {

			var r = outlineLayerData.data[pixelPos],
				g = outlineLayerData.data[pixelPos + 1],
				b = outlineLayerData.data[pixelPos + 2],
				a = outlineLayerData.data[pixelPos + 3];

			// If current pixel of the outline image is black
			if (r + g + b < 100 && a === 255) {
				//console.log("current pixel is black then it is an outline");
				return false;
			}

			r = colorLayerData.data[pixelPos];
			g = colorLayerData.data[pixelPos + 1];
			b = colorLayerData.data[pixelPos + 2];

			// If the current pixel matches the clicked color
			if (r === clickedColorR && g === clickedColorG && b === clickedColorB) {
				//console.log("current pixel matches the clicked color");
				return true;
			}

			// If current pixel matches the new color
			if (r === newColorR && g === newColorG && b === newColorB) {
				//console.log("current pixel matches the new color");
				return false;
			}

			return true;
		},

		colorPixel = function (pixelPos) {

			colorLayerData.data[pixelPos] = newColorR;
			colorLayerData.data[pixelPos + 1] = newColorG;
			colorLayerData.data[pixelPos + 2] = newColorB;
			colorLayerData.data[pixelPos + 3] = 255;
		},

		floodFill = function () {

			var newPos,
				x,
				y,
				pixelPos,
				reachLeft,
				reachRight,
				drawingBoundLeft = drawingAreaX,
				drawingBoundTop = drawingAreaY,
				drawingBoundRight = drawingAreaX + drawingAreaWidth - 1,
				drawingBoundBottom = drawingAreaY + drawingAreaHeight - 1;

			while (pixelStack.length) {

				newPos = pixelStack.pop();
				x = newPos[0];
				y = newPos[1];

				// Get current pixel position
				pixelPos = (y * canvasWidth + x) * 4;

				// Go up as long as the color matches and are inside the canvas
				while (y >= drawingBoundTop && matchClickedColor(pixelPos)) {
					y -= 1;
					pixelPos -= canvasWidth * 4;
				}

				pixelPos += canvasWidth * 4;
				y += 1;
				reachLeft = false;
				reachRight = false;

				// Go down as long as the color matches and in inside the canvas
				while (y < drawingBoundBottom && matchClickedColor(pixelPos)) {
					y += 1;

					colorPixel(pixelPos);

					if (x > drawingBoundLeft) {
						if (matchClickedColor(pixelPos - 4)) {
							if (!reachLeft) {
								// Add pixel to stack
								pixelStack.push([x - 1, y]);
								reachLeft = true;
							}
						} else if (reachLeft) {
							reachLeft = false;
						}
					}

					if (x < drawingBoundRight) {
						if (matchClickedColor(pixelPos + 4)) {
							if (!reachRight) {
								// Add pixel to stack
								pixelStack.push([x + 1, y]);
								reachRight = true;
							}
						} else if (reachRight) {
							reachRight = false;
						}
					}

					pixelPos += canvasWidth * 4;
				}
			}
			redraw();
		},

		flood = function (startX, startY) {

			var pixelPos = (startY * canvasWidth + startX) * 4,
				r = colorLayerData.data[pixelPos],
				g = colorLayerData.data[pixelPos + 1],
				b = colorLayerData.data[pixelPos + 2],
				a = outlineLayerData.data[pixelPos + 3];

			clickedColorR = r;
			clickedColorG = g;
			clickedColorB = b;

			newColorR = color[curColorIndex].r;
			newColorG = color[curColorIndex].g;
			newColorB = color[curColorIndex].b;

			if (clickedColorR === newColorR && clickedColorG === newColorG && clickedColorB === newColorB) {
				// Return because trying to fill with the same color
				return;
			}

			if (r + g + b < 100 && a === 255) {
				// Return because clicked outline
				return;
			}

			pixelStack = [[startX, startY]];

			floodFill();
		},

		// Paint based on mouse click location
		paintAt = function (mouseX, mouseY) {

			flood(mouseX, mouseY);
		},

		// Add mouse event listeners to the canvas
		createMouseEvents = function () {

			$('#canvas').mousedown(function (e) {
				// Mouse down location
				var mouseX = e.pageX - this.offsetLeft,
					mouseY = e.pageY - this.offsetTop;

				if (mouseX < drawingAreaX) { // Left of the drawing area
					if (mouseX > mediumStartX) {
						if (mouseY > mediumStartY && mouseY < mediumStartY + mediumImageHeight) {
							curColorIndex = 0;
							curColor = colorPurple;
							redraw();
						} else if (mouseY > mediumStartY + mediumImageHeight && mouseY < mediumStartY + mediumImageHeight * 2) {
							curColorIndex = 1;
							curColor = colorGreen;
							redraw();
						} else if (mouseY > mediumStartY + mediumImageHeight * 2 && mouseY < mediumStartY + mediumImageHeight * 3) {
							curColorIndex = 2;
							curColor = colorYellow;
							redraw();
						} else if (mouseY > mediumStartY + mediumImageHeight * 3 && mouseY < mediumStartY + mediumImageHeight * 4) {
							curColorIndex = 3;
							curColor = colorBrown;
							redraw();
						}
					}
				} else if ((mouseY > drawingAreaY && mouseY < drawingAreaY + drawingAreaHeight) && (mouseX <= drawingAreaX + drawingAreaWidth)) {
					// Mouse click location on drawing area
					paintAt(mouseX, mouseY);
				}
			});

			$('#canvas').mousemove(function (e) {
				if (paint) {
					addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
					redraw();
				}
			});

			$('#canvas').mouseup(function () {
				paint = false;
				redraw();
			});

			$('#canvas').mouseleave(function () {
				paint = false;
			});
		},

		// Calls the redraw function after all neccessary resources are loaded.
		resourceLoaded = function () {

			curLoadResNum += 1;
			if (curLoadResNum === totalLoadResources) {
				createMouseEvents();
				redraw();
			}
		},

		// Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
		init = function () {

			// Create the canvas (Neccessary for IE because it doesn't know what a canvas element is)
			var canvasDiv = document.getElementById('canvasDiv');
			canvas = document.createElement('canvas');
			canvas.setAttribute('width', canvasWidth);
			canvas.setAttribute('height', canvasHeight);
			canvas.setAttribute('id', 'canvas');
			canvasDiv.appendChild(canvas);

			if (typeof G_vmlCanvasManager !== "undefined") {
				canvas = G_vmlCanvasManager.initElement(canvas);
			}
			context = canvas.getContext("2d"); // Grab the 2d canvas context
			// Note: The above code is a workaround for IE 8 and lower. Otherwise we could have used:
			//     context = document.getElementById('canvas').getContext("2d");

			// Load images
			backgroundImage.onload = resourceLoaded;
			backgroundImage.src = "images/background.png";

			paintImage.onload = resourceLoaded;
			paintImage.src = "images/paint-outline.png";

			outlineImage.onload = function () {
				context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);

				// Test for cross origin security error (SECURITY_ERR: DOM Exception 18)
				try {
					outlineLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
				} catch (ex) {
					window.alert("Application cannot be run locally. Please run on a server.");
					return;
				}
				clearCanvas();
				colorLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
				resourceLoaded();
			};
			outlineImage.src = "images/watermelon-duck-outline.png";
		};

	return {
		init: init
	};
}());