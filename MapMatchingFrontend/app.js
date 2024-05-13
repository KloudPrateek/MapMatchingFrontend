// Initialize two Leaflet maps
let addedLayers = [];
var map = L.map('map').setView([0,0], 2);

//Add a tile layer to the maps
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Function to fetch coordinates
function fetchAndDisplayGeoJSON() {
    console.log("working...abc");
    fetch('http://127.0.0.1:8080/map_matching_data/useful.geojson')
        .then(response => response.json())
        .then(geojson => {
            console.log(geojson);

            const lineStyle = {
                color: '#000000', // Black color
                weight: 4, // Thickness of the line
            };

            // Create a GeoJSON layer with custom style and add it to the map
            L.geoJSON(geojson, {
                style: lineStyle // Apply the custom style to all features
            }).addTo(map);

            // L.geoJSON(geojson).addTo(map);
            
            var geojsonBounds = L.geoJSON(geojson).getBounds();
            map.fitBounds(geojsonBounds); 
        })
        .catch(error => console.error('Error fetching GeoJSON:', error));
}

fetchAndDisplayGeoJSON();


function createCustomMarker(color) {
    // Define the HTML styles for the marker with the specified color
    const markerHtmlStyles = `
        background-color: ${color};
        width: 2rem;
        height: 2rem;
        display: block;
        left: -1.5rem;
        top: -1.5rem;
        position: relative;
        border-radius: 3rem 3rem 0;
        transform: rotate(45deg);
        border: 1px solid #FFFFFF`;

    // Create and return the divIcon with the specified HTML styles
    return L.divIcon({
        className: "custom-pin",
        iconAnchor: [-10, -10], // Center the icon on the clicked location
        popupAnchor: [-10, -10], // Offset for the popup if you have one
        html: `<span style="${markerHtmlStyles}" />`
    });
}

// Event listener for map click
map.on('click', function (e) {
    // Retrieve the coordinates of the clicked location
    var latlng = e.latlng;

    // Display a black marker at the clicked location
    // var marker = L.marker(latlng, {icon: createCustomMarker('#000000')}).addTo(map);
    const marker = L.marker(latlng, {icon: createCustomMarker('#000000')}).addTo(map);


// Store references to the added marker and line
    addedLayers.push(marker);
    

    // Send the coordinates to the backend via a POST request
    fetchCoordinates(latlng);
});

function fetchCoordinates(latlng) {
    console.log("Fetching coordinates...");
    console.log(latlng.lat);
    console.log(latlng.lng);

    // Define the data to send in the POST request
    const data = [latlng.lng, latlng.lat];

    // Define the options for the fetch request
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // Send the POST request
    fetch('http://localhost:8585/processCoordinates', options)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // Check if the response status is 204 (No Content)
        if (response.status === 204) {
            console.log('Empty response from backend');
            return null; // Return null if no content
        }
        return response.json(); // Parse JSON if content exists
    })
    .then(data => {
        if (data !== null) {
            console.log('Response from backend:', data);
            // Display the list of points on the map
            displayPoints(data);
        }
        // Handle the case when data is null (no content)
    })
    .catch(error => {
        console.error('Error sending POST request:', error);
        // Handle errors if needed
    });
}

function displayPoints(points) {
    // Extract latitude and longitude coordinates from the points
    const latLngs = points.map(point => [point.latitude, point.longitude]);
    
    const lineStyle = {
                color: '#4361ee', // Black color
                weight: 10, // Thickness of the line
            };
    // Create a polyline using the extracted coordinates and add it to the map
    const line = L.polyline(latLngs, lineStyle).addTo(map);
    addedLayers.push(line);
}

function clearData() {
// Define the data to send in the POST request
const data = { data: 'clear' };

// Define the options for the fetch request
const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
};

// Send the POST request
fetch('http://localhost:8585/clearData', options)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from backend:', data);
        clearMarkersAndLines();
        // Handle the response from the backend if needed
    })
    .catch(error => {
        console.error('Error sending POST request:', error);
        // Handle errors if needed
    });
}

// Event listener for the clear button
document.querySelector('.clear-button').addEventListener('click', function() {
    // Call the function to clear data
    clearData();
});

function clearMarkersAndLines() {
// Remove all markers and lines added by fetchCoordinates
    addedLayers.forEach(layer => map.removeLayer(layer));

    // Clear the array of added layers
    addedLayers = [];
}