// http://learningwebgl.com/blog/?p=370

function getStyle(name) {
	return document.getElementById(name).style;
}

function openCloseNav() {
	var button = document.getElementById("panel_button");
	if(button.innerHTML.indexOf("Close") >= 0) {
		closeNav();
		button.innerHTML = button.innerHTML.replace("Close", "Open");
	} else {
		openNav();
		button.innerHTML = button.innerHTML.replace("Open", "Close");
	}
}

var sidePanelWidth = "280px";
// The scale, relative to the actual display width, that the canvas will render at.
// Anything more than 1 is pointless. 
// TODO: Make it so when the device is lagging, lower this then call resizeCanvas again.
var resolutionScaleOfCanvas = 1.0;

/* Opens the right-oriented nav.*/
function openNav() {
	var sidePanelStyle = getStyle("side_panel");
	var sidePanelContentStyle = getStyle("panel_content");
	var panelButtonStyle = getStyle("panel_button");
	sidePanelContentStyle.width = sidePanelWidth;
	sidePanelStyle.left = "-" + sidePanelWidth;
	panelButtonStyle.right = sidePanelWidth;
}

/* Opens the left-oriented nav.*/
function closeNav() {
	var sidePanelStyle = getStyle("side_panel");
	var sidePanelContentStyle = getStyle("panel_content");
	var panelButtonStyle = getStyle("panel_button");
	sidePanelContentStyle.width = "1px";
	sidePanelStyle.left = "1px";
	panelButtonStyle.right = "0px";
}

// FPS counter
var timeOfLastCheck;
var framesSinceLastCheck;
var ticksAtGoodFrameRate = 0;

(function(){
    setTimeout(arguments.callee, 250);
	// TODO: Make rezise smarter if possible (If it can be determined which component is causing the lag).
    var newTime = Date.now();
	var timeSinceLastCheck = newTime - timeOfLastCheck;

	if(timeSinceLastCheck === 0)
		timeSinceLastCheck = 1;
	else if(timeSinceLastCheck < 0)
		throw "Invalid time";
	
	var FPS = ((framesSinceLastCheck / timeSinceLastCheck) * 1000).toFixed(3);
	var FPSH1 = document.getElementById("FPS");
	if(FPSH1 != null) {
		var canvas = document.getElementById("simulator").childNodes[1];
		if(renderer == null) {
			FPSH1.innerHTML = "Cannot find renderer.";
		} else {
			FPSH1.innerHTML = ("FPS: " + FPS + "\n at " + renderer.getSize().width + "x" + renderer.getSize().height);
		}
	}
	
	/*if(FPS < 30) {
		if(resolutionScaleOfCanvas > 0.5) {
			resolutionScaleOfCanvas -= 0.1;
			resizeCanvas();
		}
		ticksAtGoodFrameRate = 0;
	} else if (FPS > 50 && resolutionScaleOfCanvas < 1.0) {
		ticksAtGoodFrameRate++;
		
		if(ticksAtGoodFrameRate > 10) {
			resolutionScaleOfCanvas = Math.min(resolutionScaleOfCanvas + 0.1, 1);
			resizeCanvas();
			ticksAtGoodFrameRate = 0;
		}
	}*/

	timeOfLastCheck = newTime;
	framesSinceLastCheck = 0;
})();