var googleMap;

var initialLocations = [
	{
		name: 'University of Oregon'
	},
	{
		name: 'Alton Baker Park, 100 Day Island Road, Eugene, OR 97401, United States'
	},
	{
		name: 'Skinner Butte Park, Cheshire Avenue, Eugene, OR 97401, United States'
	}
];

var Map = function() {
	this.placeName = "Eugene, Oregon";
	this.mapOptions = {
		center: {lat: 44.0511546, lng: -123.0854287},
		zoom: 15,
		disableDefaultUI: true
	};
};

var Location = function(data) {
	var self = this;
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
		title: results[0].formatted_address
	});
	marker.setMap(googleMap);

	var wikiContent;

	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.name + '&format=json&callback=wikiCallback';

	var wikiRequestTimeout = setTimeout(function() {
		wikiContent = "Failed to get Wikipedia information";
	}, 8000);

	$.ajax({
		url: wikiUrl,
		dataType: "jsonp",
		success: function(response) {
			//get the wikiContent here to put in the infoWindow content
			//build a div?
			console.log(response);
		}
	});

	var infoWindow = new google.maps.InfoWindow({
		content: marker.title.toString()
	});

	google.maps.event.addListener(marker, 'click', function() {
		infoWindow.open(googleMap, marker);
	});
}

var ViewModel = function() {
	var self = this;
	var map = new Map();
	this.locationList = ko.observableArray([]);

	this.initialize = function() {
		var gMap = new google.maps.Map(document.getElementById('map'), map.mapOptions);
		googleMap = gMap;
		initialLocations.forEach(function(location) {
			self.locationList.push( new Location(location.name));
		});
	}
	this.initialize();


};

ko.applyBindings(new ViewModel());