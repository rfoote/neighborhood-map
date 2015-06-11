//Variables that are global to this js file include the Google map,
//and the lists of markers, info windows, locations, and search locations.
var googleMap;
var markerList = ko.observableArray([]);
var infoWindowList = ko.observableArray([]);
var locationList = ko.observableArray([]);
var searchLocationList = ko.observableArray([]);

//Points of interest that I chose for the map.
var initialLocations = [
	{
		name: 'University of Oregon'
	},
	{
		name: 'Alton Baker Park'
	},
	{
		name: 'Skinner Butte Park'
	},
	{
		name: 'Oregon Electric Station'
	}
];

//The model includes a Map, Locations (my points of interest specified in the initialLocations array), 
//and a UserLocation (what the user enters into the search box).

//The map inclues the place that I chose as the city of interest
//and the map options needed to display the corresponding Google map.
var Map = function() {
	this.placeName = "Eugene, Oregon";
	this.mapOptions = {
		center: {lat: 44.0511546, lng: -123.0854287},
		zoom: 14
	};
};

//A location consists of a place name, and information about the place
//from Google Places.
var Location = function(data) {
	this.placeName = ko.observable(data);
	this.placeInfo = ko.computed(function() {
		var service = new google.maps.places.PlacesService(googleMap);
		var request = {
			query: data
		};
		service.textSearch(request, callback);
	}, this);
};

//A user location is what the user enters into the search box.
//It only includes the text entered into the search box ("placeName").
var UserLocation = function(data) {
	this.placeName = ko.observable(data);
};

//In the instantiation of a Location, the Google Places service is sent
//a request for information on the location. The following is the callback
//function that's called after the request completes.
//The following calls another function that creates a map marker
//and info window for the location, if the Google Places request
//was successful.
function callback(results, status) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		createMapMarkerAndInfoWindow(results);
	}
}

//This function creates the map marker and info window associated
//with a location/point of interest.
function createMapMarkerAndInfoWindow(results) {
	//Create the marker with the data received from the
	//Google Places request.
	var marker = new google.maps.Marker({
		name: results[0].name,
		position: results[0].geometry.location,
		title: results[0].formatted_address,
		icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});
	
	//Place the marker on the map and add the marker to the marker list.
	marker.setMap(googleMap);
	markerList.push(marker);

	//Search for the location/point of interest on Wikipedia, and request
	//a link to that information to be displayed in the info window.
	var wikiContent, contentDiv;

	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.name + '&format=json&callback=wikiCallback';

	//If the request fails, show an error message.
	var wikiRequestTimeout = setTimeout(function() {
		wikiContent = "Error: Failed to get Wikipedia information";
	}, 8000);

	//Make the request, and upon success, format the data into html for the info window.
	$.ajax({
		url: wikiUrl,
		dataType: "jsonp",
		success: function(response) {
			wikiContent = response[3][0];
			contentDiv = '<div id="infoWindowContent">' +
				'<div id="' + marker.name + '">' +
				'<h5>' + marker.name + '</h5>' +
				'<p><a href="' + wikiContent + '" target="_blank">' + wikiContent + '</a></p>' +
				'</div>' +
				'</div>';

			//Create the info window and put the formatted content in it.
			var infoWindow = new google.maps.InfoWindow({
				content: contentDiv
			});

			//Add the info window to the list of info windows.
			infoWindowList.push(infoWindow);

			//Add an event listener to the map marker so that when it's clicked,
			//the appropriate info window opens, while any other open ones are closed.
			//Also update the location list so that only the clicked location is shown
			//in bold.
			google.maps.event.addListener(marker, 'click', function() {
				var index = 0;
				
				//Iterate through all of the info windows, closing them.
				var infoArrLength = infoWindowList().length;
				for (var i = 0; i < infoArrLength; i++) {
					infoWindowList()[i].close();
				}
				
				//Reset all markers to use the red marker icon.
				var markerArrLength = markerList().length;
				for (var i = 0; i < markerArrLength; i++) {
					markerList()[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
				}
				
				//Open the info window of the clicked marker, and change the marker color to green.
				infoWindow.open(googleMap, marker);
				marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
				
				//Unbold all items in Location List
				$(".locClass").css('font-weight', 'normal');
				
				//And bold the right item in Location List by matching names.
				var nameToMatch = marker.name;
				var arrlength = locationList().length;
				for (var i = 0; i < arrlength; i++) {
					if (nameToMatch === locationList()[i].placeName()) {
						index = i;
						break;
					}
				}
				$("#locList ul li").eq(index).css('font-weight', 'bold');
			});
		}
	});
}

//The ViewModel initializes the map, and manages elements that the user interacts with
//including the list view of locations and the search bar.
var ViewModel = function() {
	var self = this;
	
	//Instantiate a Map object for the Googla Map.
	var map = new Map();

	//This function sets the map based on the map object's options.
	//If the call to Google Maps results in an undefined map, an error message is displayed.
	this.initialize = function() {
		var gMap = new google.maps.Map(document.getElementById('map'), map.mapOptions);
		if (typeof gMap != 'undefined') {
			googleMap = gMap;
		}
		else {
			var errorHtml = '<p>Error: The map was unable to load.</p>';
			$("#map").append(errorHtml);
		}

	};
	this.initialize();

	//Add the initial locations specified in the initialLocations array to the location list.
	initialLocations.forEach(function(location) {
		locationList.push( new Location(location.name));
	});

	//Add a list item to the list view of locations, one for each location.
	var listHtml = '<ul data-bind="foreach: locationList"><li class="locClass" data-bind="text: placeName, click: $parent.changeLoc"></li></ul>';
	$("#locList").append(listHtml);

	//Set the current location to the first one in the location list.
	this.currentLoc = ko.observable(locationList()[0]);

	//Initialize a UserLocation object that will hold whatever the user enters into the search box.
	this.userLocation = new UserLocation("");

	//Add all of the intitial locations from the initialLocations array to the searchLocationList.
	initialLocations.forEach(function(location) {
		searchLocationList.push( new Location(location.name));
	});

	//This function updates map markers based on items clicked by the user in the list view of locations.
	this.changeLoc = function(clickedLoc, event) {
		//Change the current location to the one that was clicked.
		self.currentLoc(clickedLoc);
		var index = 0;
		var infoIndex = 0;

		//Find the marker that corresponds to the clicked item in the list view.
		var nameToMatch = self.currentLoc().placeName();
		var arrlength = markerList().length;
		for (var i = 0; i < arrlength; i++) {
			if (nameToMatch === markerList()[i].name) {
				index = i;
			}
		}

		//Change all markers back to red.
		for (var j = 0; j < arrlength; j++) {
			markerList()[j].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
		}
		
		//Make the current marker the one that corresponds to the clicked item.
		var currentMarker = markerList()[index];
				
		//And change the current marker to green to show it was the one clicked.
		currentMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
		
		//Close all info windows.
		var infoArrLength = infoWindowList().length;
		for (var k = 0; k < infoArrLength; k++) {
			infoWindowList()[k].close();
		}
		
		//Find the correct info window in the list by matching location names.
		for (var m = 0; m < infoArrLength; m++) {
			var divTxt = infoWindowList()[m].content;
			divTxt = divTxt.slice(37);
			var stopIndex = divTxt.indexOf('"');
			divTxt = divTxt.slice(0, stopIndex);
			if (nameToMatch === divTxt) {
				infoIndex = m;
			}
		}
		
		//Make the current info window the one that corresponds to the clicked marker and open it.
		var currentInfoWindow = infoWindowList()[infoIndex];	
		currentInfoWindow.open(googleMap, currentMarker);
		
		//Unbold all list items except for the cliked one.
		$(".locClass").css('font-weight', 'normal');
		$(event.target).css('font-weight', 'bold');
	};

	//This function filters map markers and list view items based on what the user enters into
	//the search box (by changing the userLocation).
	this.changeUserLocation = function() {
		//Remove all locations from the searchLocationList to start.
		var arrlength = searchLocationList().length;
		for (var j = 0; j < arrlength; j++) {
			searchLocationList.pop();
		}
		
		//Get the text that the user has entered into the search box, convert it to lowercase,
		//and count how many characters the user has entered at this point.
		var txt = $("#searchTxt").val();
		self.userLocation.placeName = txt;
		var nameToMatch = self.userLocation.placeName.toLowerCase();
		var numCharsToMatch = nameToMatch.length;
		
		//Using this information, add any locations to the searchLocationList that match what
		//the user has entered at this point.
		arrlength = locationList().length;
		for (var i = 0; i < arrlength; i++) {
			if (nameToMatch === locationList()[i].placeName().toLowerCase().slice(0, numCharsToMatch)) {
				searchLocationList.push( new Location(locationList()[i].placeName()));
			}
		}
		
		//Filter map markers and list items based on what's in searchLocationList, showing or hiding them.
		//Hide all markers to start
		var markArrlength = markerList().length;
		for (var k = 0; k < markArrlength; k++) {
			markerList()[k].setVisible(false);
		}

		//Hide all list items, and make their font normal weight.
		$(".locClass").each(function() {
			this.style.fontWeight = "normal";
			this.style.visibility = "hidden";
		});

		//Also close all info windows
		for (var p = 0; p < infoWindowList().length; p++)
		{
			infoWindowList()[p].close();
		}

		//Iterate through the locations in the searchLocationList, and make
		//any matches in the markers and in the list items visible.
		for (var m = 0; m < searchLocationList().length; m++) {
			for (var n = 0; n < markArrlength; n++) {
				if (markerList()[n].name === searchLocationList()[m].placeName()) {
					markerList()[n].setVisible(true);
				}
			}
			$(".locClass").each(function() {
				if ($(this).text() === searchLocationList()[m].placeName()) {
					this.style.visibility = "visible";
				}
			})
		}
	};
};

ko.applyBindings(new ViewModel());