(function () {
    const DEFAULT_VIEW = {
        center: [51.1657, 10.4515],
        zoom: 6
    };

    const ROUTING_SERVICE_URL = "https://router.project-osrm.org/route/v1";
    const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

    const state = {
        map: null,
        routeControl: null,
        markers: [],
        start: null,
        ziel: null,
        autocompleteTimer: null,
        activeSuggestionRequest: null
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", initApp);

    function initApp() {
        cacheElements();
        initMap();
        bindEvents();
    }

    function cacheElements() {
        elements.form = document.getElementById("route-form");
        elements.startInput = document.getElementById("start");
        elements.zielInput = document.getElementById("ziel");
        elements.startSuggestions = document.getElementById("start-suggestions");
        elements.zielSuggestions = document.getElementById("ziel-suggestions");
        elements.startError = document.getElementById("start-error");
        elements.zielError = document.getElementById("ziel-error");
        elements.routeError = document.getElementById("route-error");
        elements.calculateButton = document.getElementById("calculate-btn");
        elements.clearButton = document.getElementById("clear-btn");
        elements.results = document.getElementById("results-section");
        elements.distance = document.getElementById("distance");
        elements.duration = document.getElementById("duration");
        elements.routeInfo = document.getElementById("route-info");
    }

    function initMap() {
        if (!window.L) {
            showRouteError("Leaflet konnte nicht geladen werden. Bitte prüfe die Internetverbindung.");
            return;
        }

        state.map = L.map("map", {
            zoomControl: false
        }).setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);

        L.control.zoom({
            position: "bottomright"
        }).addTo(state.map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
            minZoom: 3
        }).addTo(state.map);
    }

    function bindEvents() {
        elements.form.addEventListener("submit", function (event) {
            event.preventDefault();
            calculateRoute();
        });

        elements.clearButton.addEventListener("click", clearPlanner);

        elements.startInput.addEventListener("input", function () {
            state.start = null;
            handleAutocomplete(elements.startInput.value, "start");
        });

        elements.zielInput.addEventListener("input", function () {
            state.ziel = null;
            handleAutocomplete(elements.zielInput.value, "ziel");
        });

        elements.startInput.addEventListener("keydown", handleInputKeydown);
        elements.zielInput.addEventListener("keydown", handleInputKeydown);

        document.addEventListener("pointerdown", function (event) {
            if (!event.target.closest(".autocomplete-wrapper")) {
                closeSuggestions();
            }
        });
    }

    function handleInputKeydown(event) {
        if (event.key === "Escape") {
            closeSuggestions();
        }
    }

    function handleAutocomplete(query, field) {
        const normalizedQuery = query.trim();
        const suggestionsElement = getSuggestionsElement(field);

        clearTimeout(state.autocompleteTimer);

        if (state.activeSuggestionRequest) {
            state.activeSuggestionRequest.abort();
            state.activeSuggestionRequest = null;
        }

        if (normalizedQuery.length < 3) {
            clearSuggestions(suggestionsElement);
            return;
        }

        state.autocompleteTimer = setTimeout(async function () {
            const controller = new AbortController();
            state.activeSuggestionRequest = controller;

            try {
                const suggestions = await fetchAddressSuggestions(normalizedQuery, controller.signal);
                renderSuggestions(suggestions, field, suggestionsElement);
            } catch (error) {
                if (error.name !== "AbortError") {
                    clearSuggestions(suggestionsElement);
                }
            } finally {
                if (state.activeSuggestionRequest === controller) {
                    state.activeSuggestionRequest = null;
                }
            }
        }, 280);
    }

    async function fetchAddressSuggestions(query, signal) {
        const url = new URL(NOMINATIM_SEARCH_URL);
        url.searchParams.set("format", "json");
        url.searchParams.set("q", query);
        url.searchParams.set("limit", "7");
        url.searchParams.set("countrycodes", "de");
        url.searchParams.set("addressdetails", "1");

        const response = await fetch(url.toString(), { signal });

        if (!response.ok) {
            throw new Error("Adressvorschläge konnten nicht geladen werden.");
        }

        const results = await response.json();

        return results.map(function (result) {
            return {
                label: result.display_name,
                lat: Number(result.lat),
                lng: Number(result.lon)
            };
        }).filter(function (result) {
            return Number.isFinite(result.lat) && Number.isFinite(result.lng);
        });
    }

    function renderSuggestions(suggestions, field, suggestionsElement) {
        clearSuggestions(suggestionsElement);

        if (!suggestions.length) {
            return;
        }

        suggestions.forEach(function (suggestion) {
            const item = document.createElement("li");
            item.tabIndex = 0;
            item.textContent = suggestion.label;
            item.addEventListener("click", function () {
                selectSuggestion(suggestion, field);
            });
            item.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    selectSuggestion(suggestion, field);
                }
            });
            suggestionsElement.appendChild(item);
        });

        suggestionsElement.classList.add("active");
    }

    function selectSuggestion(suggestion, field) {
        const input = getInputElement(field);
        input.value = suggestion.label;

        state[field] = {
            lat: suggestion.lat,
            lng: suggestion.lng,
            label: suggestion.label
        };

        clearSuggestions(getSuggestionsElement(field));
        clearErrors();
    }

    async function calculateRoute() {
        if (!state.map) {
            showRouteError("Die Karte ist noch nicht bereit.");
            return;
        }

        if (!window.L || !L.Routing || !L.Routing.control) {
            showRouteError("Die Routing-Bibliothek konnte nicht geladen werden. Bitte lade die Seite neu.");
            return;
        }

        const startAddress = elements.startInput.value.trim();
        const zielAddress = elements.zielInput.value.trim();

        clearErrors();

        if (!startAddress) {
            showFieldError("start", "Bitte eine Start-Adresse eingeben.");
        }

        if (!zielAddress) {
            showFieldError("ziel", "Bitte eine Ziel-Adresse eingeben.");
        }

        if (!startAddress || !zielAddress) {
            return;
        }

        setBusy(true);

        try {
            const start = await resolveAddress(startAddress, "start");
            const ziel = await resolveAddress(zielAddress, "ziel");

            if (!start) {
                showFieldError("start", `Start-Adresse nicht gefunden: "${startAddress}"`);
                return;
            }

            if (!ziel) {
                showFieldError("ziel", `Ziel-Adresse nicht gefunden: "${zielAddress}"`);
                return;
            }

            state.start = start;
            state.ziel = ziel;

            drawRoute(start, ziel);
        } catch (error) {
            showRouteError("Die Route konnte nicht berechnet werden. Bitte versuche es erneut.");
        } finally {
            setBusy(false);
        }
    }

    async function resolveAddress(address, field) {
        const cached = state[field];

        if (cached && cached.label === address) {
            return cached;
        }

        const suggestions = await fetchAddressSuggestions(address);

        if (!suggestions.length) {
            return null;
        }

        return {
            lat: suggestions[0].lat,
            lng: suggestions[0].lng,
            label: suggestions[0].label
        };
    }

    function drawRoute(start, ziel) {
        removeRouteLayers();
        showPendingResults();

        state.markers = [
            createMarker(start, "start").addTo(state.map).bindPopup("Start"),
            createMarker(ziel, "ziel").addTo(state.map).bindPopup("Ziel")
        ];

        state.routeControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(ziel.lat, ziel.lng)
            ],
            router: L.Routing.osrmv1({
                serviceUrl: ROUTING_SERVICE_URL
            }),
            lineOptions: {
                styles: [
                    { color: "#14b8a6", opacity: 0.95, weight: 5 },
                    { color: "#f59e0b", opacity: 0.45, weight: 9 }
                ],
                extendToWaypoints: true,
                missingRouteTolerance: 2
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            routeWhileDragging: false,
            show: false,
            showAlternatives: false,
            createMarker: function () {
                return null;
            }
        }).addTo(state.map);

        state.routeControl.on("routesfound", function (event) {
            const route = event.routes[0];
            if (route && route.summary) {
                renderRouteMetrics(route.summary.totalDistance, route.summary.totalTime, "Straßenroute");
            }
        });

        state.routeControl.on("routingerror", function () {
            renderFallbackMetrics(start, ziel);
            showRouteError("OSRM konnte keine Straßenroute liefern. Angezeigt wird die Luftlinien-Entfernung.");
        });
    }

    function createMarker(location, type) {
        const isEnd = type === "ziel";
        const icon = L.divIcon({
            className: "",
            html: `
                <span class="route-marker ${isEnd ? "route-marker-end" : ""}" aria-hidden="true">
                    ${getMarkerIcon(isEnd)}
                </span>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18]
        });

        return L.marker([location.lat, location.lng], { icon });
    }

    function getMarkerIcon(isEnd) {
        if (isEnd) {
            return '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 4v16"/><path d="M6 5h10l-2 4 2 4H6"/></svg>';
        }

        return '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
    }

    function showPendingResults() {
        elements.results.hidden = false;
        elements.distance.textContent = "-";
        elements.duration.textContent = "Wird berechnet";
        elements.routeInfo.textContent = "Routingdaten werden geladen.";
    }

    function renderRouteMetrics(distanceMeters, durationSeconds, sourceLabel) {
        const distanceKm = distanceMeters / 1000;
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
        const averageSpeed = Math.round(distanceKm / (durationSeconds / 3600));

        elements.results.hidden = false;
        elements.distance.textContent = distanceKm.toFixed(2);
        elements.duration.textContent = formatDuration(durationMinutes);
        elements.routeInfo.textContent = `${sourceLabel} mit ca. ${averageSpeed} km/h Durchschnitt.`;
        clearErrors();
    }

    function renderFallbackMetrics(start, ziel) {
        const distanceKm = calculateDistance(start, ziel);

        elements.results.hidden = false;
        elements.distance.textContent = distanceKm.toFixed(2);
        elements.duration.textContent = "Nicht verfügbar";
        elements.routeInfo.textContent = "Luftlinien-Entfernung ohne Fahrzeit.";
    }

    function calculateDistance(start, ziel) {
        const earthRadiusKm = 6371;
        const latDistance = toRadians(ziel.lat - start.lat);
        const lngDistance = toRadians(ziel.lng - start.lng);
        const startLat = toRadians(start.lat);
        const zielLat = toRadians(ziel.lat);

        const a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(startLat) * Math.cos(zielLat)
            * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function toRadians(value) {
        return value * Math.PI / 180;
    }

    function formatDuration(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (!hours) {
            return `${minutes} min`;
        }

        if (!minutes) {
            return `${hours} h`;
        }

        return `${hours} h ${minutes} min`;
    }

    function clearPlanner() {
        elements.form.reset();
        elements.results.hidden = true;
        elements.distance.textContent = "-";
        elements.duration.textContent = "-";
        elements.routeInfo.textContent = "";

        clearErrors();
        closeSuggestions();
        removeRouteLayers();

        state.start = null;
        state.ziel = null;

        if (state.map) {
            state.map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
        }
    }

    function removeRouteLayers() {
        if (state.routeControl) {
            state.map.removeControl(state.routeControl);
            state.routeControl = null;
        }

        state.markers.forEach(function (marker) {
            marker.remove();
        });
        state.markers = [];
    }

    function setBusy(isBusy) {
        elements.calculateButton.disabled = isBusy;
        elements.calculateButton.querySelector("span").textContent = isBusy ? "Berechne Route" : "Route berechnen";
    }

    function showFieldError(field, message) {
        const errorElement = field === "start" ? elements.startError : elements.zielError;
        errorElement.textContent = message;
    }

    function showRouteError(message) {
        elements.routeError.textContent = message;
    }

    function clearErrors() {
        elements.startError.textContent = "";
        elements.zielError.textContent = "";
        elements.routeError.textContent = "";
    }

    function closeSuggestions() {
        clearSuggestions(elements.startSuggestions);
        clearSuggestions(elements.zielSuggestions);
    }

    function clearSuggestions(suggestionsElement) {
        suggestionsElement.innerHTML = "";
        suggestionsElement.classList.remove("active");
    }

    function getInputElement(field) {
        return field === "start" ? elements.startInput : elements.zielInput;
    }

    function getSuggestionsElement(field) {
        return field === "start" ? elements.startSuggestions : elements.zielSuggestions;
    }
})();
