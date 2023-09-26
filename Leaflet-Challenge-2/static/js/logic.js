// Initialize Map and Set Its Initial View
var mymap = L.map('map', {
    center: [0, 0],
    zoom: 2
});

// Define Base Layers: Streets and Satellite
var streets = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; OpenStreetMap contributors, Imagery © Mapbox',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibGV2YW5nZXRpYSIsImEiOiJjbG1zY2xmajYwZjR2MmtuMThjYTcwM2IzIn0.idVYIpfTneCXnJei1cfWrw'
}).addTo(mymap);

var satellite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; OpenStreetMap contributors, Imagery © Mapbox',
    id: 'mapbox/satellite-v9',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibGV2YW5nZXRpYSIsImEiOiJjbG1zY2xmajYwZjR2MmtuMThjYTcwM2IzIn0.idVYIpfTneCXnJei1cfWrw'
});

// Define Overlay Layers: Earthquakes and Tectonic Plates
var earthquakes = new L.LayerGroup();
var tectonicPlates = new L.LayerGroup();
var heatLayer = new L.LayerGroup(); // Define Heat Layer

// Base Maps Object for Layer Control
var baseMaps = {
    "Streets": streets,
    "Satellite": satellite
};

// Overlay Maps Object for Layer Control
var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates,
    "Heatmap": heatLayer // Include Heat Layer
};

// Layer Control Initialization
L.control.layers(baseMaps, overlayMaps).addTo(mymap);

// Array to Hold Heatmap Data
var heatArray = [];

// Load and plot Earthquake Data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(data) {
    function styleInfo(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            fillColor: getColor(feature.geometry.coordinates[2]),
            color: "#000000",
            radius: getRadius(feature.properties.mag),
            stroke: true,
            weight: 0.5
        };
    }

   // Function to Define Color Based on Earthquake Depth
function getColor(depth) {
    return depth > 90 ? "#ea2c2c" :
           depth > 70 ? "#ea822c" :
           depth > 50 ? "#ee9c00" :
           depth > 30 ? "#eecc00" :
           depth > 10 ? "#d4ee00" :
           "#98ee00";  
}

// Function to Define Radius Based on Earthquake Magnitude
function getRadius(magnitude) {
    if (magnitude === 0) {
        return 1;  // return a minimal radius for earthquakes with zero magnitude
    }
    return magnitude * 4;  // scale other magnitudes by a factor of 4 for visibility
}


    L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        onEachFeature: function(feature, layer) {
            var date = new Date(feature.properties.time);
            layer.bindPopup("Magnitude: " + feature.properties.mag + "<br>Depth: " + feature.geometry.coordinates[2] + "<br>Location: " + feature.properties.place + "<br>Time: " + date);
        }
    }).addTo(earthquakes);

    // Populate Heatmap Data Array
    data.features.forEach(feature => {
        var location = feature.geometry.coordinates;
        heatArray.push([location[1], location[0]]);
    });
    
// Create and Add Heatmap Layer to Map
mymap.on('load', function() {
    var heat = L.heatLayer(heatArray, {
      radius: 20,
      blur: 35
    }).addTo(heatLayer);
  });

// Load and plot Tectonic Plates Data
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData) {
    L.geoJson(plateData, {
        color: "orange",
        weight: 2
    }).addTo(tectonicPlates);

    tectonicPlates.addTo(mymap);
});

// Create Legend with Colors
var legend = L.control({position: 'bottomright'});

legend.onAdd = function() {
    var div = L.DomUtil.create('div', 'info legend');
    var depths = [-10, 10, 30, 50, 70, 90];
    var colors = [
        "#98ee00",
        "#d4ee00",
        "#eecc00",
        "#ee9c00",
        "#ea822c",
        "#ea2c2c"
    ];

    // Loop Through Depth Intervals and Generate a Label with a Colored Square for Each Interval
    for (var i = 0; i < depths.length; i++) {
        div.innerHTML +=
            '<i style="background: ' + colors[i] + '"></i> ' +
            depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
    }

    return div;
};

// Add Legend to Map
legend.addTo(mymap)});