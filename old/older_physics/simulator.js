function getStyle(name) {
	return document.getElementById(name).style;
}

function openCloseNav() {
	var button = document.getElementById("panel-button");
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
	var sidePanelStyle = getStyle("side-panel");
	var sidePanelContentStyle = getStyle("panel-content");
	var panelButtonStyle = getStyle("panel-button");
	sidePanelContentStyle.width = sidePanelWidth;
	sidePanelStyle.left = "-" + sidePanelWidth;
	panelButtonStyle.right = sidePanelWidth;
}

/* Opens the left-oriented nav.*/
function closeNav() {
	var sidePanelStyle = getStyle("side-panel");
	var sidePanelContentStyle = getStyle("panel-content");
	var panelButtonStyle = getStyle("panel-button");
	sidePanelContentStyle.width = "1px";
	sidePanelStyle.left = "1px";
	panelButtonStyle.right = "0px";
}

/* Popups and Dropdowns */

/**
 * On calling of this function, a popup will display on screen, and 
 *
 * @param title: A string of the name of the title of the window.
 */
function openPopup(title) {
	var overlayContainer = document.getElementById("overlay-popup-container");
	var titleDivs = overlayContainer.getElementsByClassName("popup-title");
	var contentDivs = overlayContainer.getElementsByClassName("popup-content");
	for(var i = 0; i < titleDivs.length; i++) {
		titleDivs[i].innerHTML = title;
	}
	
	var contentHTML = getSettingsHTML();
	for(var i = 0; i < contentDivs.length; i++) {
		contentDivs[i].innerHTML = contentHTML;
	}
	overlayContainer.style.display = "inherit";
	setTimeout( function() {
		if(overlayContainer.style.display === "inherit") {
			overlayContainer.style.opacity = "1";
		}
	}, 5);
	getStyle("simulator").filter = "blur(4px)";
}
http://stackoverflow.com/questions/18930361/how-to-load-another-html-file-using-js


function getSettingsHTML() {
	var html = '';
	
	if(settings) {
		for(var i = 0; i < settings.length; i++) {
			
			var setting = settings[i];
			var options = setting.getOptions();
			var optionsLength = options.length;
			
			html = '<form>\n<div class="setting">';
			html+= '<div class="setting-title">' + setting.title + '</div>';
			html+= '<form>';
			for(var j = 0; j < optionsLength; j++) {
				var option = options[j];
				
				html+= '<input type="radio" name="' + setting.title + '" value="' + option.functionCallData + '"' + (option.enabled ? "checked" : "") + ' onclick=\'updateSetting("' + setting.title + '", "' + option.title + '")\'>' + option.title + '';
			}
			html+= '</form>';
			html+= '</div>\n</form>';
		}
	} else {
		html = '<h2>Settings not loaded.</h2>';
	}
	
	return html;
}

function closePopup() {
	var overlayContainer = document.getElementById("overlay-popup-container");
	var titleDivs = overlayContainer.getElementsByClassName("popup-title");
	for(var i = 0; i < titleDivs.length; i++) {
		titleDivs[i].innerHTML = "";
	}

	overlayContainer.style.opacity = "0";
	getStyle("simulator").filter = "none";
	
	if(overlayContainer.style.display !== "none") {
		setTimeout( function() {
			if(overlayContainer.style.opacity === "0") {
				overlayContainer.style.display = "none";
			}
		}, 200);
	}
}

function toggleDropdown(dropDownName, elementToBeUnder) {
	var dropDown = document.getElementById(dropDownName);
	if(dropDown) {
		if(getComputedStyle(dropDown).display !== "none") { // is currently visible
			
		} else {
			// Make sure display block goes before all of the other stuff
			dropDown.style.display = "block";
			
			var pointerX = elementToBeUnder.offsetLeft + elementToBeUnder.offsetWidth / 2;
			var pointerY = elementToBeUnder.offsetTop + elementToBeUnder.offsetHeight;
			var maxX = document.body.clientWidth - dropDown.clientWidth;
			
			var windowX = pointerX - dropDown.offsetWidth / 2;
			
			windowX = Math.min(windowX, maxX - 10);
			windowX = Math.max(windowX, 10);
			dropDown.style.left = windowX + "px";
			dropDown.style.top = pointerY + "px";
			var arrows = dropDown.getElementsByClassName("dropdown-arrow");
			
			for(var i = 0; i < arrows.length; i++) {
				arrows[i].style.left = (pointerX - windowX - arrows[i].offsetWidth / 2) + "px";
			}
			
			setTimeout( function() {
				if(dropDown.style.display === "block") { // Makes sure it is the same
					dropDown.classList.add("dropdown-visible");
				}
			}, 5);
		}
	}
}

function closeDropdown(dropDown) {
	dropDown.classList.remove("dropdown-visible");	
	setTimeout( function() {
		if(!dropDown.classList.contains("dropdown-visible")) { // Makes sure it is the same
			dropDown.style.display = "none";
		}
	}, 250);
}

function closeAllDropdowns() {
	var dropdowns = document.getElementsByClassName("dropdown");
	for (var i = 0; i < dropdowns.length; i++) {
		var openDropdown = dropdowns[i];
		if (openDropdown.classList.contains('dropdown-visible')) {
			closeDropdown(openDropdown);
		}
	}
}

window.addEventListener("resize", closeAllDropdowns);

document.addEventListener("click", function(e) {
	var element = document.getElementById('overlay-popup-container');
	if(element !== undefined && element.style.display !== "none") {
		if (e.target === element || e.target.className == "popup-closebutton") {
			closePopup();
		}
	}
	
	if(event.target && !isDecendentClass(event.target, "dropdown")) {
		closeAllDropdowns();
	}
});

function isDecendentClass(element, className) {
	while(element != undefined) {
		if(element.classList.contains(className)) {
			return true;
		}

		element = element.parentElement;
	}
	return false;
}