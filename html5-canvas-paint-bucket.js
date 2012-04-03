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

var canvas;
var context;
var canvasWidth = 490;
var canvasHeight = 220;
var padding = 25;
var lineWidth = 8;

//var colorPurple = "#cb3594";
var colorPurple = new Object();
colorPurple.r = 203;
colorPurple.g = 53;
colorPurple.b = 148;
//var colorGreen = "#659b41";
var colorGreen = new Object();
colorGreen.r = 101;
colorGreen.g = 155;
colorGreen.b = 65;
//var colorYellow = "#ffcf33";
var colorYellow = new Object();
colorYellow.r = 255;
colorYellow.g = 207;
colorYellow.b = 51;
//var colorBrown = "#986928";
var colorBrown = new Object();
colorBrown.r = 152;
colorBrown.g = 105;
colorBrown.b = 40;

var color = [colorPurple, colorGreen, colorYellow, colorBrown];
var curColorIndex = 0;
var curColor = colorPurple;

var outlineImage = new Image();
var paintImage = new Image();
var crayonImage = new Image();
var markerImage = new Image();
var eraserImage = new Image();
var backgroundImage = new Image();
var clickX = new Array();
var clickY = new Array();
var clickColor = new Array();
var clickTool = new Array();
var clickSize = new Array();
var clickDrag = new Array();
var paint = false;

var curTool = "crayon";
var curSize = "normal";
var mediumStartX = 18;
var mediumStartY = 19;
var mediumImageWidth = 93;
var mediumImageHeight = 46;
var drawingAreaX = 111;
var drawingAreaY = 11;
var drawingAreaWidth = 267;
var drawingAreaHeight = 200;
var toolHotspotStartY = 23;
var toolHotspotHeight = 38;
var sizeHotspotStartY = 157;
var sizeHotspotHeight = 36;
var sizeHotspotWidthObject = new Object();
sizeHotspotWidthObject.huge = 39;
sizeHotspotWidthObject.large = 25;
sizeHotspotWidthObject.normal = 18;
sizeHotspotWidthObject.small = 16;

var outlineLayerData;
var colorLayerData;
var pixelVisited;
var neighbors = [[1,0], [0,-1], [-1,0], [0,1], [1,1], [1,-1], [-1,-1], [-1,1]];
var pixelStack = new Array();
var newColorR;
var newColorG;
var newColorB;
var newColorA;
var clickedColorR;
var clickedColorG;
var clickedColorB;
var clickedColorA;
var pixelsDrawn;

var paths = new Array();

function executeArticleScript() {
	prepareCanvas();
}

var totalLoadResources = 3;
var curLoadResNum = 0;
/**
* Calls the redraw function after all neccessary resources are loaded.
*/
function resourceLoaded()
{
	if(++curLoadResNum >= totalLoadResources){
		redraw();
	}
}

/**
* Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
*/
function prepareCanvas()
{
	// Create the canvas (Neccessary for IE because it doesn't know what a canvas element is)
	var canvasDiv = document.getElementById('canvasDiv');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', canvasWidth);
	canvas.setAttribute('height', canvasHeight);
	canvas.setAttribute('id', 'canvas');
	canvasDiv.appendChild(canvas);
	
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}
	context = canvas.getContext("2d"); // Grab the 2d canvas context
	// Note: The above code is a workaround for IE 8 and lower. Otherwise we could have used:
	//     context = document.getElementById('canvas').getContext("2d");
	
	// Load images
	// -----------	
	backgroundImage.onload = function() { resourceLoaded(); 
	}
	backgroundImage.src = "images/background.png";

	paintImage.onload = function() { resourceLoaded(); 
	}
	paintImage.src = "images/paint-outline.png";
	
	outlineImage.onload = function() {
		context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
		outlineLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
		clearCanvas();
		colorLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
		resourceLoaded(); 
	}
	outlineImage.src = "images/watermelon-duck-outline.png";
	
	// Add mouse events
	// ----------------
	$('#canvas').mousedown(function(e)
	{
		// Mouse down location
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		
		if(mouseX < drawingAreaX) // Left of the drawing area
		{
			if(mouseX > mediumStartX)
			{
				if(mouseY > mediumStartY && mouseY < mediumStartY + mediumImageHeight){
					curColorIndex = 0;
					curColor = colorPurple;
					redraw();
				}else if(mouseY > mediumStartY + mediumImageHeight && mouseY < mediumStartY + mediumImageHeight * 2){
					curColorIndex = 1;
					curColor = colorGreen;
					redraw();
				}else if(mouseY > mediumStartY + mediumImageHeight * 2 && mouseY < mediumStartY + mediumImageHeight * 3){
					curColorIndex = 2;
					curColor = colorYellow;
					redraw();
				}else if(mouseY > mediumStartY + mediumImageHeight * 3 && mouseY < mediumStartY + mediumImageHeight * 4){
					curColorIndex = 3;
					curColor = colorBrown;
					redraw();
				}
			}
		}
		else if(mouseX > drawingAreaX + drawingAreaWidth){
			
		}
		else if(mouseY > drawingAreaY && mouseY < drawingAreaY + drawingAreaHeight)
		{
			// Mouse click location on drawing area
			paintAt(mouseX, mouseY);
		}
		
	});
	
	$('#canvas').mousemove(function(e){
		if(paint==true){
			addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
			redraw();
		}
	});
	
	$('#canvas').mouseup(function(e){
		paint = false;
	  	redraw();
	});
	
	$('#canvas').mouseleave(function(e){
		paint = false;
	});
}

/**
* Adds a point to the drawing array.
* @param x
* @param y
* @param dragging
*/
function addClick(x, y, dragging)
{
	clickX.push(x);
	clickY.push(y);
	clickTool.push(curTool);
	clickColor.push(curColor);
	clickSize.push(curSize);
	clickDrag.push(dragging);
}

/**
* Clears the canvas.
*/
function clearCanvas()
{
	//canvas.width = canvas.width; // clears the canvas 
	context.fillStyle = '#ffffff'; // Work around for Chrome
	context.fillRect(0, 0, canvasWidth, canvasHeight); // Fill in the canvas with white
}

/**
* Redraws the canvas.
*/
function redraw()
{
	// Make sure required resources are loaded before redrawing
	if(curLoadResNum < totalLoadResources){ return; }
	
	clearCanvas();
	
	if(colorLayerData){
		context.putImageData(colorLayerData, 0, 0);
		colorLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
	}
	
	context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

	var locX, locY;

		// Purple
		locX = (curColorIndex == 0) ? 52 : 52; //18
		locY = 19;
		
		context.beginPath();
		/*context.moveTo(locX + 41, locY + 11);
		context.lineTo(locX + 41, locY + 35);
		context.lineTo(locX + 29, locY + 35);
		context.lineTo(locX + 29, locY + 33);
		context.lineTo(locX + 11, locY + 27);
		context.lineTo(locX + 11, locY + 19);
		context.lineTo(locX + 29, locY + 13);
		context.lineTo(locX + 29, locY + 11);
		context.lineTo(locX + 41, locY + 11);*/
		context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
		context.closePath();
		context.fillStyle = "rgb(" + colorPurple.r + "," + colorPurple.g + "," + colorPurple.b + ")";
		context.fill();	

		if(curColorIndex == 0){
			context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);
			
		}else{
			context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
		}
		
		// Green
		locX = (curColorIndex == 1) ? 52 : 52;
		locY += 46;
		
		context.beginPath();
		/*context.moveTo(locX + 41, locY + 11);
		context.lineTo(locX + 41, locY + 35);
		context.lineTo(locX + 29, locY + 35);
		context.lineTo(locX + 29, locY + 33);
		context.lineTo(locX + 11, locY + 27);
		context.lineTo(locX + 11, locY + 19);
		context.lineTo(locX + 29, locY + 13);
		context.lineTo(locX + 29, locY + 11);
		context.lineTo(locX + 41, locY + 11);
		context.closePath();*/
		context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
		context.fillStyle = "rgb(" + colorGreen.r + "," + colorGreen.g + "," + colorGreen.b + ")";
		context.fill();	

		if(curColorIndex == 1){
			context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);
			
		}else{
			context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
		}
		
		// Yellow
		locX = (curColorIndex == 2) ? 52 : 52;
		locY += 46;
		
		context.beginPath();
		/*context.moveTo(locX + 41, locY + 11);
		context.lineTo(locX + 41, locY + 35);
		context.lineTo(locX + 29, locY + 35);
		context.lineTo(locX + 29, locY + 33);
		context.lineTo(locX + 11, locY + 27);
		context.lineTo(locX + 11, locY + 19);
		context.lineTo(locX + 29, locY + 13);
		context.lineTo(locX + 29, locY + 11);
		context.lineTo(locX + 41, locY + 11);
		context.closePath();*/
		context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
		context.fillStyle = "rgb(" + colorYellow.r + "," + colorYellow.g + "," + colorYellow.b + ")";
		context.fill();

		if(curColorIndex == 2){
			context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);
			
		}else{
			context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
		}
		
		// Yellow
		locX = (curColorIndex == 3) ? 52 : 52;
		locY += 46;
		
		context.beginPath();
		/*context.moveTo(locX + 41, locY + 11);
		context.lineTo(locX + 41, locY + 35);
		context.lineTo(locX + 29, locY + 35);
		context.lineTo(locX + 29, locY + 33);
		context.lineTo(locX + 11, locY + 27);
		context.lineTo(locX + 11, locY + 19);
		context.lineTo(locX + 29, locY + 13);
		context.lineTo(locX + 29, locY + 11);
		context.lineTo(locX + 41, locY + 11);
		context.closePath();*/
		context.arc(locX + 46, locY + 23, 18, 0, Math.PI * 2, true);
		context.fillStyle = "rgb(" + colorBrown.r + "," + colorBrown.g + "," + colorBrown.b + ")";
		context.fill();	

		if(curColorIndex == 3){
			context.drawImage(paintImage, 0, 0, 59, mediumImageHeight, locX, locY, 59, mediumImageHeight);
			
		}else{
			context.drawImage(paintImage, locX, locY, mediumImageWidth, mediumImageHeight);
		}
	
	

	// Draw the outline image
	context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
}




/**
* Paint based on mouse click location
*/
function paintAt(mouseX, mouseY)
{	
	flood(mouseX,mouseY);
}

/**********************************************************/

function flood(startX, startY)
{
	var pixelPos = (startY*canvasWidth + startX)*4;
	
	//console.log("outline: " + outlineLayerData.data[pixelPos] +","+ outlineLayerData.data[pixelPos+1] +","+ outlineLayerData.data[pixelPos+2] +","+ outlineLayerData.data[pixelPos+3]);
	
	var r = colorLayerData.data[pixelPos + 0];
	var g = colorLayerData.data[pixelPos + 1];
	var b = colorLayerData.data[pixelPos + 2];
	var a = colorLayerData.data[pixelPos + 3];
	//console.log("clicked color:   " + r +","+ g +","+ b +","+ a);
	
	clickedColorR = r;
	clickedColorG = g;
	clickedColorB = b;
	
	newColorR = color[curColorIndex].r;
	newColorG = color[curColorIndex].g;
	newColorB = color[curColorIndex].b;
	
	//console.log("new color:   " + newColorR +","+ newColorG +","+ newColorB);
	
	if(clickedColorR == newColorR && clickedColorG == newColorG && clickedColorB == newColorB)
	{
	 	//console.log("Return because trying to fill with the same color");
	 	return;
	 }
	 
	 if(outlineLayerData.data[pixelPos] + outlineLayerData.data[pixelPos+1] + outlineLayerData.data[pixelPos+2] == 0 && outlineLayerData.data[pixelPos+ 3] == 255)
	{
	 	//console.log("Return because clicked outline: " + outlineLayerData.data[pixelPos+4]);
	 	return;
	 }

	//console.log("PUSH: " + (startX - drawingAreaX - 2) + "," + (startY - drawingAreaY - 2));
    pixelStack = [[startX, startY]];
	
	floodFill();
} 

function floodFill()
{
	var newPos, x, y, pixelPos, reachLeft, reachRight;
	var drawingBoundLeft = drawingAreaX;
	var drawingBoundTop = drawingAreaY;
	var drawingBoundRight = drawingAreaX + drawingAreaWidth - 1;
	var drawingBoundBottom = drawingAreaY + drawingAreaHeight - 1;
	
	while(pixelStack.length)
    {
		newPos = pixelStack.pop();
		x = newPos[0];
		y = newPos[1];
		
		//console.log("POP: " + (x - drawingAreaX - 2) + "," + (y - drawingAreaY - 2));
		
		pixelPos = (y*canvasWidth + x) * 4;
		// Go up as long as the color matches and are inside the canvas
        while(y-- >= drawingBoundTop && matchClickedColor(pixelPos))
		{
			//console.log("UP: " + (x - drawingAreaX - 2) + "," + (y - drawingAreaY - 2));
			pixelPos -= canvasWidth * 4;
		}
		pixelPos += canvasWidth * 4;
        ++y;
        reachLeft = false;
		reachRight = false;
		// Go down as long as the color matches and in inside the canvas
        while(y++ < drawingBoundBottom && matchClickedColor(pixelPos))
        {
			colorPixel(pixelPos);
			//console.log("COLOR: " + (x - drawingAreaX - 2) + "," + (y - drawingAreaY - 2));
			
			if(x > drawingBoundLeft)
			{
				if(matchClickedColor(pixelPos - 4)){
					if(!reachLeft){
						pixelStack.push([x - 1, y]);
						//console.log("PUSH: " + ((x-1) - drawingAreaX - 2) + "," + (y - drawingAreaY - 2));
						reachLeft = true;
					}
				}else if(reachLeft){
					reachLeft = false;
				}
			}
			if(x < drawingBoundRight)
			{
				if(matchClickedColor(pixelPos + 4)){
					if(!reachRight){
						pixelStack.push([x + 1, y]);
						//console.log("PUSH: " + ((x+1) - drawingAreaX - 2) + "," + (y - drawingAreaY - 2));
						reachRight = true;
					}
				}else if(reachRight){
					reachRight = false;
				}
			}
			
			pixelPos += canvasWidth * 4;
        }
    }
	redraw();
}

function matchClickedColor(pixelPos)
{
	var r = outlineLayerData.data[pixelPos];
	var g = outlineLayerData.data[pixelPos+1];
	var b = outlineLayerData.data[pixelPos+2];
	var a = outlineLayerData.data[pixelPos+3];
	
	// If current pixel is black then it is an outline
	if(r + g + b == 0 && a == 255){ return false; } 
	
	r = colorLayerData.data[pixelPos];	
	g = colorLayerData.data[pixelPos+1];	
	b = colorLayerData.data[pixelPos+2];
	
	// If the current pixel matches the clicked color
	if(r == clickedColorR && g == clickedColorG && b == clickedColorB) return true;

	// If current pixel matches the new color
	if(r == newColorR && g == newColorG && b == newColorB) return false;
	
	return true;
}

function colorPixel(pixelPos)
{
	colorLayerData.data[pixelPos] = newColorR;
	colorLayerData.data[pixelPos+1] = newColorG;
	colorLayerData.data[pixelPos+2] = newColorB;
	colorLayerData.data[pixelPos+3] = 255;
}

/**
* Create html5 path from pixel object
*/
function createPath(shapePixelData)
{
	var edgePixels = [];
	var i,j;
	
	for(i=0; i < canvasWidth; i++);
	{
		for(j=0; j < canvasHeight; j++);
		{
			
		}
	}
}

/**/