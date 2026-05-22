// Globale Variablen
let map;
let routeControl;
let startCoords = null;
let endCoords = null;
let autocompleteTimeout;

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
});

// Karte initialisieren
function initMap() {
    // Karte mit Zentrierung auf Deutschland
    map = L.map('map').setView([51.1657, 10.4515], 6);
    
    // OpenStreetMap Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(map);
    
    // Geocoder hinzufügen (für Adresssuche)
    L.Control.geocoder({
        defaultMarkGeocode: false
    }).on('markgeocode', function(e) {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
            [bbox.getSouthEast().lat, bbox.getSouthWest().lng],
            [bbox.getSouthEast().lat, bbox.getNorthEast().lng],
            [bbox.getNorthWest().lat, bbox.getNorthEast().lng],
            [bbox.getNorthWest().lat, bbox.getSouthWest().lng]
        ]).addTo(map);
        map.fitBounds(poly.getBounds());
    }).addTo(map);
}

// Event Listener einrichten
function setupEventListeners() {
    document.getElementById('calculate-btn').addEventListener('click', calculateRoute);
    document.getElementById('clear-btn').addEventListener('click', clearRoute);
    
    // Autocomplete für Start-Adresse
    document.getElementById('start').addEventListener('input', function(e) {
        handleAutocomplete(e.target.value, 'start');
    });
    
    // Autocomplete für Ziel-Adresse
    document.getElementById('ziel').addEventListener('input', function(e) {
        handleAutocomplete(e.target.value, 'ziel');
    });
    
    // Enter-Taste zum Berechnen
    document.getElementById('start').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
    document.getElementById('ziel').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
    
    // Click outside to close suggestions
    document.addEventListener('click', function(e) {
        if (!e.target.classList.contains('autocomplete-suggestions') && 
            !e.target.id.includes('suggestions') && 
            !e.target.id === 'start' && 
            !e.target.id === 'ziel') {
            document.querySelectorAll('.autocomplete-suggestions').forEach(el => {
                el.classList.remove('active');
            });
        }
    });
}

// Autocomplete Handler
async function handleAutocomplete(query, field) {
    const suggestionsElement = document.getElementById(`${field}-suggestions`);
    
    if (query.length < 2) {
        suggestionsElement.classList.remove('active');
        return;
    }
    
    // Entferne alten Timeout
    clearTimeout(autocompleteTimeout);
    
    // Neuer Timeout für Debouncing
    autocompleteTimeout = setTimeout(async () => {
        try {
            const suggestions = await fetchAddressSuggestions(query);
            displayAutocompleteSuggestions(suggestions, field, suggestionsElement);
        } catch (error) {
            console.error('Autocomplete-Fehler:', error);
            suggestionsElement.classList.remove('active');
        }
    }, 300);
}

// Adressvorschläge abrufen
async function fetchAddressSuggestions(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=7&countrycodes=de`
        );
        
        if (!response.ok) throw new Error('Suggestions-Fehler');
        
        const results = await response.json();
        
        return results.map(result => ({
            name: result.display_name,
            lat: result.lat,
            lng: result.lon,
            address: result.address
        }));
    } catch (error) {
        console.error('Suggestion-Fehler:', error);
        return [];
    }
}

// Autocomplete-Vorschläge anzeigen
function displayAutocompleteSuggestions(suggestions, field, suggestionsElement) {
    suggestionsElement.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsElement.classList.remove('active');
        return;
    }
    
    suggestions.forEach((suggestion, index) => {
        const li = document.createElement('li');
        li.textContent = suggestion.name;
        li.addEventListener('click', function() {
            selectSuggestion(suggestion, field);
        });
        suggestionsElement.appendChild(li);
    });
    
    suggestionsElement.classList.add('active');
}

// Vorschlag auswählen
function selectSuggestion(suggestion, field) {
    document.getElementById(field).value = suggestion.name;
    document.getElementById(`${field}-suggestions`).classList.remove('active');
    
    // Speichere die Koordinaten
    if (field === 'start') {
        startCoords = {
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lng),
            name: suggestion.name
        };
    } else if (field === 'ziel') {
        endCoords = {
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lng),
            name: suggestion.name
        };
    }
}

// Route berechnen
async function calculateRoute() {
    const startAddress = document.getElementById('start').value.trim();
    const endAddress = document.getElementById('ziel').value.trim();
    
    clearErrors();
    
    if (!startAddress || !endAddress) {
        showError('start', 'Bitte beide Adressen eingeben');
        return;
    }
    
    // Loading-State
    const btn = document.getElementById('calculate-btn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
        // Verwende gecachte Koordinaten falls vorhanden, sonst geocodiere
        if (!startCoords || startCoords.name !== startAddress) {
            startCoords = await geocodeAddress(startAddress);
        }
        
        if (!endCoords || endCoords.name !== endAddress) {
            endCoords = await geocodeAddress(endAddress);
        }
        
        if (!startCoords) {
            showError('start', `Start-Adresse nicht gefunden: "${startAddress}"`);
            return;
        }
        
        if (!endCoords) {
            showError('ziel', `Ziel-Adresse nicht gefunden: "${endAddress}"`);
            return;
        }
        
        // Route auf der Karte darstellen
        displayRoute(startCoords, endCoords);
        
        // Ergebnisse anzeigen
        displayResults(startCoords, endCoords);
        
    } catch (error) {
        console.error('Fehler bei Routenberechnung:', error);
        showError('start', 'Fehler bei der Routenberechnung. Bitte versuchen Sie es erneut.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Adresse zu Koordinaten
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        
        if (!response.ok) throw new Error('Geocoding fehler');
        
        const results = await response.json();
        
        if (results.length === 0) {
            return null;
        }
        
        const result = results[0];
        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name
        };
    } catch (error) {
        console.error('Geocoding-Fehler:', error);
        return null;
    }
}

// Route anzeigen
function displayRoute(start, end) {
    // Alte Route entfernen
    if (routeControl) {
        map.removeControl(routeControl);
    }
    
    // Leaflet Routing Machine mit OSRM API
    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(start.lat, start.lng),
            L.latLng(end.lat, end.lng)
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
            styles: [
                { color: '#667eea', opacity: 0.8, weight: 5 },
                { color: '#764ba2', opacity: 0.4, weight: 10 }
            ],
            extendToWaypoints: true,
            missingRouteTolerance: 2
        },
        addWaypoints: false,
        draggableWaypoints: true,
        fitSelectedRoutes: true,
        showAlternatives: false,
        altLineOptions: {
            styles: [
                { color: '#ccc', opacity: 0.5, weight: 3 }
            ]
        }
    }).addTo(map);
    
    // Start- und Endpunkte markieren
    L.marker([start.lat, start.lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup('📍 Start');
    
    L.marker([end.lat, end.lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup('🎯 Ziel');
}

// Ergebnisse anzeigen
async function displayResults(start, end) {
    try {
        // Reale Routendaten von OSRM abrufen
        const routeData = await getRouteData(start, end);
        
        const resultsSection = document.getElementById('results-section');
        const distanceElement = document.getElementById('distance');
        const durationElement = document.getElementById('duration');
        const routeInfoElement = document.getElementById('route-info');
        
        if (routeData) {
            // Mit echten OSRM-Daten
            const distanceKm = (routeData.distance / 1000).toFixed(2);
            const durationMin = Math.round(routeData.duration / 60);
            const durationHours = Math.floor(durationMin / 60);
            const durationMins = durationMin % 60;
            
            distanceElement.textContent = distanceKm;
            
            if (durationHours > 0) {
                durationElement.textContent = `${durationHours}h ${durationMins}min`;
            } else {
                durationElement.textContent = `${durationMins}min`;
            }
            
            const avgSpeed = Math.round(routeData.distance / (routeData.duration / 3600) / 1000);
            routeInfoElement.textContent = `Durchschnitt: ${avgSpeed} km/h`;
        } else {
            // Fallback auf Luftlinien-Entfernung
            const distance = calculateDistance(start, end);
            distanceElement.textContent = distance.toFixed(2);
            durationElement.textContent = 'Berechnung lädt...';
            routeInfoElement.textContent = 'Luftlinien-Entfernung';
        }
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Fehler bei Ergebnisanzeige:', error);
    }
}

// Entfernung zwischen zwei Koordinaten berechnen (Haversine-Formel)
function calculateDistance(start, end) {
    const R = 6371; // Erdradius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Route-Daten von OSRM abrufen
async function getRouteData(start, end) {
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`
        );
        
        if (!response.ok) throw new Error('Route API-Fehler');
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            return {
                distance: data.routes[0].distance,
                duration: data.routes[0].duration
            };
        }
        
        return null;
    } catch (error) {
        console.error('OSRM-Fehler:', error);
        return null;
    }
}

// Route löschen
function clearRoute() {
    document.getElementById('start').value = '';
    document.getElementById('ziel').value = '';
    document.getElementById('results-section').style.display = 'none';
    clearErrors();
    
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }
    
    // Alle Marker entfernen
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    startCoords = null;
    endCoords = null;
    
    // Karte auf Deutschland zurückzentrieren
    map.setView([51.1657, 10.4515], 6);
}

// Fehler anzeigen
function showError(field, message) {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Fehler löschen
function clearErrors() {
    document.getElementById('start-error').textContent = '';
    document.getElementById('ziel-error').textContent = '';
}
