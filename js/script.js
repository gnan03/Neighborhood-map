var map;

function initialize() {
  map = new google.maps.Map(document.getElementById(
    'map'), {
    center: {
      lat: 37.7879384,
      lng: -122.4075056
    },
    zoom: 13
  });
  ko.applyBindings(new ViewModel());
}
//Error handling for loading google maps API
function mapError() {
  document.getElementById('map').innerHTML =
    "Oops,something went wrong!Please try again later.";
}
var locationModel = [{
    name: "Ghirardelli Square",
    location: {
      lat: 37.8053923,
      lng: -122.4235114
    }
  },
  {
    name: "Aquarium of the Bay",
    location: {
      lat: 37.7956659,
      lng: -122.3935534
    }
  },
  {
    name: "Exploratorium",
    location: {
      lat: 37.8016649,
      lng: -122.397348
    }
  },
  {
    name: "Ferry Building",
    location: {
      lat: 37.7949529,
      lng: -122.3927297
    }
  },
  {
    name: "Pier 39",
    location: {
      lat: 37.80867300000001,
      lng: -122.409821
    }
  },
  {
    name: "Waterfront Restaurant",
    location: {
      lat: 37.7993601,
      lng: -122.397385
    }
  },
  {
    name: "Levi's Plaza",
    location: {
      lat: 37.8022053,
      lng: -122.4015023
    }
  }
];
var nextVenue = function(data) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.hours = ko.observable(data.hours);
  this.type = ko.observable(data.type);
};
var Location = function(data) {
  this.name = ko.observable(data.name);
  this.lat = ko.observable(data.location
    .lat);
  this.lng = ko.observable(data.location
    .lng);
};
var ViewModel = function() {
  var self = this;
  //Used to toggle list view for small screen widths
  this.isOpen = ko.observable(false);
  //Used to toggle display for FourSquare API header
  this.onSelect = ko.observable(false);
  //Displays name of the selected location in the FourSquare API header
  this.selected = ko.observable('');
  //This holds the value entered in the filter input
  this.query = ko.observable("");
  this.onError = ko.observable(false);
  var largeInfowindow = new google.maps
    .InfoWindow();
  //This view model makes use of four ko arrays
  //This holds the markers
  self.markers = ko.observableArray([]);
  //This holds the locations in the list view
  self.locList = ko.observableArray([]);
  //This is used when the list view is filtered
  self.searchList = ko.observableArray(
    []);
  //This holds the data returned by FourSquare API
  self.nextVenueList = ko.observableArray(
    []);
  //Load location data into two ko arrays
  locationModel.forEach(function(
    locItem) {
    self.locList.push(new Location(
      locItem));
    //This list is for use when list items are filtered
    self.searchList.push(new Location(
      locItem));
  });
  //Loads data from FourSquare API to display other venues of interest nearby
  this.loadFSQdata = function(title,
    latlngVal) {
    self.nextVenueList.removeAll();
    var response;
    var nextVenueItem = {};
    //Displays the FourSQAPI header
    self.onSelect(true);
    self.selected(title);
    $.ajax({
      type: "GET",
      dataType: "json",
      cache: false,
      async: true,
      url: 'https://api.foursquare.com/v2/venues/explore?ll=' +
        latlngVal +
        '&limit=10&client_id=DQL1ALP10TCCOWDHBTXHPVY2I245KBPICVHY23Z1PDP5ABX0&client_secret=E4A5TZZXTGPRUP4NEYOGSZ5BTPVCRSLURSJSAKW3R2DWSZXT&v=20151010&m=foursquare&section=nextVenues',
      //If request is successful, load data into view model's ko array.
      success: function(data) {
        response = data.response.groups[
          0].items;
        for (var i = 0; i < response.length; i++) {
          nextVenueItem.name = response[
            i].venue.name;
          nextVenueItem.address =
            response[i].venue.location.formattedAddress;
          if (response[i].venue.hours &&
            response[i].venue.hours.status
          )
            nextVenueItem.hours =
            response[i].venue.hours.status;
          else
            nextVenueItem.hours =
            "Not Available";
          nextVenueItem.type = response[
            i].venue.categories[0].name;
          self.nextVenueList.push(new nextVenue(
            nextVenueItem));
        }
      },
      error: function(data) {
        //Show the error message and hide the results div
        self.onError(true);
        self.onSelect(false);
      }
    });
  };
  //Function to load infoWindow when a marker is clicked
  this.populateInfoWindow = function(
    marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      infowindow.marker = marker;
    }
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick',
      function() {
        infowindow.setMarker = null;
      });
    //Loads street view image in the infowindow
    var latlngVal = marker.position.lat() +
      "," + marker.position.lng();
    var streetviewURL =
      'http://maps.googleapis.com/maps/api/streetview?size=300x100&location=' +
      latlngVal;
    infowindow.setContent('<div>' +
      marker.title + '</div>' +
      '<img class="bgimg" src="' +
      streetviewURL + '">');
    //Displays Four Square data on the page
    self.loadFSQdata(marker.title,
      latlngVal);
  };
  //Function to stop the marker bounce
  this.stopAnimation = function(marker) {
    setTimeout(function() {
      marker.setAnimation(null);
    }, 3000);
  };
  //Function to animate the marker when clicked
  this.animateMarker = function(marker) {
    var title = marker.title;
    for (var i = 0; i < self.markers().length; i++) {
      if (title === self.markers()[i].title) {
        //If animation has already been set on the marker, set it to null 
        //otherwise set it to bounce 
        if (self.markers()[i].getAnimation() !==
          null) {
          self.markers()[i].setAnimation(
            null);
        } else {
          self.markers()[i].setAnimation(
            google.maps.Animation.BOUNCE);
          self.stopAnimation(self.markers()[
            i]);
        }
      }
    }
  };
  //Called when a location is selected from the list
  this.openMarker = function(
    selectedMarker) {
    var name = selectedMarker.name();
    var latlngVal = selectedMarker.lat() +
      "," + selectedMarker.lng();
    //Use populateinfowindow function to open an infowindow when the marker is clicked
    for (var i = 0; i < self.markers().length; i++) {
      if (name === self.markers()[i].title) {
        self.animateMarker(self.markers()[
          i]);
        self.populateInfoWindow(self.markers()[
          i], largeInfowindow);
      }
    }
  };
  this.createMarker = function(title,
    position, index) {
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation
        .DROP,
      id: index
    });
    //Adds a listener that opens infoWindow when clicked.
    marker.addListener('click',
      function() {
        self.animateMarker(this);
        self.populateInfoWindow(this,
          largeInfowindow);
      });
    self.markers.push(marker);
  };
  //This function creates markers and sets them on the map
  this.setMarkers = function(points) {
    var position = {};
    var title = '';
    for (var i = 0; i < points.length; i++) {
      // Get the position from the location array.
      position.lat = points[i].lat();
      position.lng = points[i].lng();
      title = points[i].name();
      self.createMarker(title, position,
        i);
    }
  };
  //Once the markers array has been populated, call setMarkers function to add them to the map
  self.setMarkers(self.locList());
  //This function is called when filter is on, to display only the filtered locations
  this.setFilterMarkers = function() {
    //Loop through the search list and set only those markers on the map
    for (var i = 0; i < self.searchList()
      .length; i++) {
      for (var j = 0; j < self.markers()
        .length; j++) {
        if (self.searchList()[i].name() ===
          self.markers()[j].title) {
          self.markers()[j].setMap(map);
        }
      }
    }
  };
  //Function to toggle the listView menu bar 
  this.displayMenu = function() {
    this.isOpen(!this.isOpen());
  };
  //Hide all markers when the list is being filtered
  this.hideListings = function() {
    for (var i = 0; i < self.markers().length; i++) {
      self.markers()[i].setMap(null);
    }
  };
  //Function to filter the list based on user's input
  this.search = function(value) {
    var temp = "";
    var obj = {};
    obj.location = {};
    //Remove the existing markers from the search array
    self.searchList.removeAll();
    self.hideListings();
    for (var i = 0; i < self.locList().length; i++) {
      temp = self.locList()[i].name();
      //If there is a match, add the location to searchList array
      if (temp.toLowerCase().indexOf(
          value.toLowerCase()) >= 0) {
        obj.name = self.locList()[i].name();
        obj.location.lat = self.locList()[
          i].lat();
        obj.location.lng = self.locList()[
          i].lng();
        self.searchList.push(new Location(
          obj));
      }
    }
    //Use this to repopulate markers on the screen
    self.setFilterMarkers();
  };
  self.query.subscribe(self.search);
};