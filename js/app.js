var googleMap;
var markerList = ko.observableArray([]);
var infoWindowList = ko.observableArray([]);
var locationList = ko.observableArray([]);

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

var Map = function() {
	this.placeName = "Eugene, Oregon";
	this.mapOptions = {
		center: {lat: 44.0511546, lng: -123.0854287},
		zoom: 15
	};
};

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

function callback(results, status) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		createMapMarkerAndInfoWindow(results);
	}
}

function createMapMarkerAndInfoWindow(results) {
	var marker = new google.maps.Marker({
		name: results[0].name,
		position: results[0].geometry.location,
		title: results[0].formatted_address,
		icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});
	marker.setMap(googleMap);

	markerList.push(marker);

	var wikiContent, contentDiv;

	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.name + '&format=json&callback=wikiCallback';

	var wikiRequestTimeout = setTimeout(function() {
		wikiContent = "Failed to get Wikipedia information";
	}, 8000);

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

			var infoWindow = new google.maps.InfoWindow({
				content: contentDiv
			});

			infoWindowList.push(infoWindow);

			google.maps.event.addListener(marker, 'click', function() {
				var infoArrLength = infoWindowList().length;
				for (var i = 0; i < infoArrLength; i++) {
					infoWindowList()[i].close();
				}
				var markerArrLength = markerList().length;
				for (var i = 0; i < markerArrLength; i++) {
					markerList()[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
				}
				infoWindow.open(googleMap, marker);
				marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
			});
		}
	});
}

var ViewModel = function() {
	var self = this;
	var map = new Map();

	this.initialize = function() {
		var gMap = new google.maps.Map(document.getElementById('map'), map.mapOptions);
		googleMap = gMap;
	};
	this.initialize();

	initialLocations.forEach(function(location) {
		locationList.push( new Location(location.name));
	});

	var listHtml = '<ul data-bind="foreach: locationList"><li class="locClass" data-bind="text: placeName, click: $parent.changeLoc"></li></ul>';
	$("#locList").append(listHtml);

	this.currentLoc = ko.observable(locationList()[0]);

	this.changeLoc = function(clickedLoc, event) {
		self.currentLoc(clickedLoc);
		var index = 0;
		var infoIndex = 0;
		var nameToMatch = clickedLoc.placeName();
		var arrlength = markerList().length;
		for (var i = 0; i < arrlength; i++) {
			if (nameToMatch === markerList()[i].name) {
				index = i;
				break;
			}
		}
		var currentMarker = markerList()[index];
		//Change all other markers back to red.
		for (var i = 0; i < arrlength; i++) {
			markerList()[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
		}
		currentMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
		var infoArrLength = infoWindowList().length;
		for (var i = 0; i < infoArrLength; i++) {
			infoWindowList()[i].close();
		}
		for (var i = 0; i < infoArrLength; i++) {
			var divTxt = infoWindowList()[i].content;
			divTxt = divTxt.slice(37);
			var stopIndex = divTxt.indexOf('"');
			divTxt = divTxt.slice(0, stopIndex);
			if (nameToMatch === divTxt) {
				infoIndex = i;
				break;
			}
		}
		var currentInfoWindow = infoWindowList()[infoIndex];
		currentInfoWindow.open(googleMap, currentMarker);
		$(".locClass").css('font-weight', 'normal');
		$(event.target).css('font-weight', 'bold');
	};

};

ko.applyBindings(new ViewModel());