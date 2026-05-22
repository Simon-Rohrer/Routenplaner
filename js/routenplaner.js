(function () {
    const DEFAULT_VIEW = {
        center: [51.1657, 10.4515],
        zoom: 6
    };

    const ROUTING_SERVICE_URL = "https://router.project-osrm.org/route/v1";
    const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

    const TRUCKS = [
        {
            id: "actros",
            name: "Mercedes-Benz Actros",
            consumption: 28,
            description: "effizienter Fernverkehr-LKW",
            strength: "guter Verbrauch bei hoher Alltagstauglichkeit",
            speedScore: 7
        },
        {
            id: "man-tgx",
            name: "MAN TGX",
            consumption: 30,
            description: "robuster Standard-LKW",
            strength: "solide Wahl für vielseitige Lieferstrecken",
            speedScore: 7
        },
        {
            id: "volvo-fh",
            name: "Volvo FH",
            consumption: 27,
            description: "sparsamer moderner LKW",
            strength: "niedrigster Verbrauch in der Auswahl",
            speedScore: 8
        },
        {
            id: "scania-r",
            name: "Scania R-Serie",
            consumption: 32,
            description: "leistungsstarker LKW für schwere Transporte",
            strength: "starke Leistung, wenn Zeit wichtiger als Kosten ist",
            speedScore: 10
        }
    ];

    const PRIORITIES = {
        guenstig: {
            label: "günstig",
            factor: 0.95,
            routeReason: "Die Logik bewertet niedrige Kosten höher als Geschwindigkeit."
        },
        effizient: {
            label: "effizient / ausgewogen",
            factor: 1,
            routeReason: "Die Logik wählt einen Kompromiss aus Verbrauch, Kosten und Fahrzeit."
        },
        schnell: {
            label: "schnell",
            factor: 1.15,
            routeReason: "Die Logik erlaubt höhere Kosten, wenn die Route zügiger gefahren werden soll."
        }
    };

    const state = {
        map: null,
        routeLayers: [],
        markers: [],
        currentResult: null,
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
        elements.priority = document.getElementById("priority");
        elements.dieselPrice = document.getElementById("diesel-price");
        elements.truckOptions = document.getElementById("truck-options");
        elements.selectedTruckName = document.getElementById("selected-truck-name");
        elements.selectedTruckDetails = document.getElementById("selected-truck-details");
        elements.calculateButton = document.getElementById("calculate-btn");
        elements.clearButton = document.getElementById("clear-btn");
        elements.results = document.getElementById("results-section");
        elements.distance = document.getElementById("distance");
        elements.duration = document.getElementById("duration");
        elements.routeInfo = document.getElementById("route-info");
        elements.resultTruck = document.getElementById("result-truck");
        elements.resultTruckInfo = document.getElementById("result-truck-info");
        elements.fuelLiters = document.getElementById("fuel-liters");
        elements.fuelInfo = document.getElementById("fuel-info");
        elements.cost = document.getElementById("cost");
        elements.costInfo = document.getElementById("cost-info");
        elements.recommendationTitle = document.getElementById("recommendation-title");
        elements.recommendationText = document.getElementById("recommendation-text");
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
        elements.truckOptions.addEventListener("change", function () {
            updateSelectedTruckDetails();
            refreshCostPlanFromCurrentRoute();
        });
        elements.priority.addEventListener("change", refreshCostPlanFromCurrentRoute);
        elements.dieselPrice.addEventListener("input", refreshCostPlanFromCurrentRoute);

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

        updateSelectedTruckDetails();
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

        const startAddress = elements.startInput.value.trim();
        const zielAddress = elements.zielInput.value.trim();
        const dieselPrice = getDieselPrice();

        clearErrors();

        if (!startAddress) {
            showFieldError("start", "Bitte eine Start-Adresse eingeben.");
        }

        if (!zielAddress) {
            showFieldError("ziel", "Bitte eine Ziel-Adresse eingeben.");
        }

        if (!Number.isFinite(dieselPrice) || dieselPrice <= 0) {
            showRouteError("Bitte einen gültigen Dieselpreis eingeben.");
        }

        if (!startAddress || !zielAddress || !Number.isFinite(dieselPrice) || dieselPrice <= 0) {
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

            await drawRoute(start, ziel);
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

    async function drawRoute(start, ziel) {
        removeRouteLayers();
        showPendingResults();

        state.markers = [
            createMarker(start, "start").addTo(state.map).bindPopup("Start"),
            createMarker(ziel, "ziel").addTo(state.map).bindPopup("Ziel")
        ];

        try {
            const route = await fetchRouteGeometry(start, ziel);
            drawRouteLine(route.coordinates, false);
            fitRouteBounds(route.coordinates);
            renderRouteMetrics(route.distance, route.duration, "Sichtbare Straßenroute");
        } catch (error) {
            const fallbackCoordinates = [
                [start.lat, start.lng],
                [ziel.lat, ziel.lng]
            ];

            drawRouteLine(fallbackCoordinates, true);
            fitRouteBounds(fallbackCoordinates);
            renderFallbackMetrics(start, ziel);
            showRouteError("OSRM konnte keine Straßenroute liefern. Angezeigt wird die Luftlinien-Entfernung.");
        }
    }

    async function fetchRouteGeometry(start, ziel) {
        const url = new URL(`${ROUTING_SERVICE_URL}/driving/${start.lng},${start.lat};${ziel.lng},${ziel.lat}`);
        url.searchParams.set("overview", "full");
        url.searchParams.set("geometries", "geojson");
        url.searchParams.set("steps", "false");

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error("Routingdaten konnten nicht geladen werden.");
        }

        const data = await response.json();
        const route = data.routes && data.routes[0];

        if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) {
            throw new Error("Routingdaten enthalten keine Route.");
        }

        const coordinates = route.geometry.coordinates.map(function (coordinate) {
            return [coordinate[1], coordinate[0]];
        });

        if (coordinates.length < 2) {
            throw new Error("Routingdaten enthalten zu wenige Koordinaten.");
        }

        return {
            coordinates,
            distance: route.distance,
            duration: route.duration
        };
    }

    function drawRouteLine(coordinates, isFallback) {
        const shadowLine = L.polyline(coordinates, {
            className: "route-line-shadow",
            color: "#07111a",
            opacity: 0.72,
            weight: 13,
            lineCap: "round",
            lineJoin: "round",
            interactive: false
        }).addTo(state.map);

        const routeLine = L.polyline(coordinates, {
            className: isFallback ? "route-line route-line-fallback" : "route-line",
            color: isFallback ? "#f59e0b" : "#2dd4bf",
            dashArray: isFallback ? "10 12" : null,
            opacity: 1,
            weight: 6,
            lineCap: "round",
            lineJoin: "round"
        }).addTo(state.map);

        state.routeLayers = [shadowLine, routeLine];
    }

    function fitRouteBounds(coordinates) {
        const bounds = L.latLngBounds(coordinates);
        state.map.fitBounds(bounds, {
            animate: true,
            padding: [42, 42]
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
        elements.resultTruck.textContent = getSelectedTruck().name;
        elements.resultTruckInfo.textContent = "Kosten werden nach der Route berechnet.";
        elements.fuelLiters.textContent = "-";
        elements.fuelInfo.textContent = "";
        elements.cost.textContent = "-";
        elements.costInfo.textContent = "";
        elements.recommendationTitle.textContent = "KI-Heuristik wird ausgewertet";
        elements.recommendationText.textContent = "Die Anwendung vergleicht Priorität, Truck-Verbrauch und Streckenlänge.";
    }

    function renderRouteMetrics(distanceMeters, durationSeconds, sourceLabel) {
        const distanceKm = distanceMeters / 1000;
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
        const averageSpeed = Math.round(distanceKm / (durationSeconds / 3600));
        const costPlan = calculateCostPlan(distanceKm);

        state.currentResult = {
            distanceKm,
            routeInfo: `${sourceLabel} mit ca. ${averageSpeed} km/h Durchschnitt.`
        };

        elements.results.hidden = false;
        elements.distance.textContent = distanceKm.toFixed(2);
        elements.duration.textContent = formatDuration(durationMinutes);
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
        clearErrors();
    }

    function renderFallbackMetrics(start, ziel) {
        const distanceKm = calculateDistance(start, ziel);
        const costPlan = calculateCostPlan(distanceKm);

        state.currentResult = {
            distanceKm,
            routeInfo: "Luftlinien-Entfernung ohne Fahrzeit."
        };

        elements.results.hidden = false;
        elements.distance.textContent = distanceKm.toFixed(2);
        elements.duration.textContent = "Nicht verfügbar";
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
    }

    // Kostenheuristik für den Schul-Prototyp: Strecke, Verbrauch, Dieselpreis und Priorität.
    function calculateCostPlan(distanceKm) {
        const truck = getSelectedTruck();
        const priority = getSelectedPriority();
        const dieselPrice = getDieselPrice();
        const consumedLiters = distanceKm / 100 * truck.consumption;
        const baseCost = consumedLiters * dieselPrice;
        const adjustedCost = baseCost * priority.factor;
        const recommendation = getTruckRecommendation(priority);

        return {
            truck,
            priority,
            dieselPrice,
            distanceKm,
            consumedLiters,
            baseCost,
            adjustedCost,
            recommendation
        };
    }

    function renderCostPlan(plan) {
        elements.resultTruck.textContent = plan.truck.name;
        elements.resultTruckInfo.textContent = `${formatNumber(plan.truck.consumption, 0)} l / 100 km · ${plan.truck.description}`;
        elements.fuelLiters.textContent = formatNumber(plan.consumedLiters, 1);
        elements.fuelInfo.textContent = `${formatNumber(plan.distanceKm, 2)} km × ${formatNumber(plan.truck.consumption, 0)} l / 100 km`;
        elements.cost.textContent = formatCurrency(plan.adjustedCost);
        elements.costInfo.textContent = `${formatCurrency(plan.baseCost)} Kraftstoffkosten × Faktor ${formatNumber(plan.priority.factor, 2)} (${plan.priority.label}).`;
        elements.recommendationTitle.textContent = `Empfehlung: ${plan.recommendation.truck.name}`;
        elements.recommendationText.textContent = buildRecommendationText(plan);
    }

    function refreshCostPlanFromCurrentRoute() {
        if (!state.currentResult) {
            return;
        }

        const dieselPrice = getDieselPrice();

        if (!Number.isFinite(dieselPrice) || dieselPrice <= 0) {
            showRouteError("Bitte einen gültigen Dieselpreis eingeben.");
            return;
        }

        const costPlan = calculateCostPlan(state.currentResult.distanceKm);
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
        clearErrors();
    }

    function buildRecommendationText(plan) {
        const selectedIsRecommended = plan.truck.id === plan.recommendation.truck.id;
        const selectionText = selectedIsRecommended
            ? "Der ausgewählte Truck passt zur Priorität."
            : `Ausgewählt ist ${plan.truck.name}; die Heuristik würde ${plan.recommendation.truck.name} empfehlen.`;

        return `${selectionText} ${plan.recommendation.reason} Berechnet wurden ${formatNumber(plan.consumedLiters, 1)} Liter Diesel und geschätzte Kosten von ${formatCurrency(plan.adjustedCost)}.`;
    }

    function getTruckRecommendation(priority) {
        if (priority === PRIORITIES.schnell) {
            const truck = TRUCKS.reduce(function (bestTruck, truckItem) {
                return truckItem.speedScore > bestTruck.speedScore ? truckItem : bestTruck;
            }, TRUCKS[0]);

            return {
                truck,
                reason: `${truck.name} ist bei Priorität schnell sinnvoll, weil ${truck.strength}.`
            };
        }

        if (priority === PRIORITIES.effizient) {
            const truck = TRUCKS.reduce(function (bestTruck, truckItem) {
                const truckScore = truckItem.consumption - truckItem.speedScore * 0.35;
                const bestScore = bestTruck.consumption - bestTruck.speedScore * 0.35;
                return truckScore < bestScore ? truckItem : bestTruck;
            }, TRUCKS[0]);

            return {
                truck,
                reason: `${truck.name} bietet den besten Kompromiss, weil ${truck.strength}.`
            };
        }

        const truck = TRUCKS.reduce(function (bestTruck, truckItem) {
            return truckItem.consumption < bestTruck.consumption ? truckItem : bestTruck;
        }, TRUCKS[0]);

        return {
            truck,
            reason: `${truck.name} ist die günstigste Empfehlung, weil er mit ${formatNumber(truck.consumption, 0)} l / 100 km den niedrigsten Verbrauch hat.`
        };
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

    function formatNumber(value, digits) {
        return new Intl.NumberFormat("de-DE", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }).format(value);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR"
        }).format(value);
    }

    function clearPlanner() {
        elements.form.reset();
        elements.results.hidden = true;
        elements.distance.textContent = "-";
        elements.duration.textContent = "-";
        elements.routeInfo.textContent = "";
        elements.resultTruck.textContent = "-";
        elements.resultTruckInfo.textContent = "";
        elements.fuelLiters.textContent = "-";
        elements.fuelInfo.textContent = "";
        elements.cost.textContent = "-";
        elements.costInfo.textContent = "";
        elements.recommendationTitle.textContent = "-";
        elements.recommendationText.textContent = "";

        clearErrors();
        closeSuggestions();
        removeRouteLayers();
        updateSelectedTruckDetails();

        state.start = null;
        state.ziel = null;
        state.currentResult = null;

        if (state.map) {
            state.map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
        }
    }

    function removeRouteLayers() {
        state.routeLayers.forEach(function (layer) {
            layer.remove();
        });
        state.routeLayers = [];

        state.markers.forEach(function (marker) {
            marker.remove();
        });
        state.markers = [];
    }

    function setBusy(isBusy) {
        elements.calculateButton.disabled = isBusy;
        elements.calculateButton.querySelector("span").textContent = isBusy ? "Berechne Route" : "Route berechnen";
    }

    function getSelectedTruck() {
        const selectedTruckId = elements.form.elements.truck.value;
        return TRUCKS.find(function (truck) {
            return truck.id === selectedTruckId;
        }) || TRUCKS[0];
    }

    function getSelectedPriority() {
        return PRIORITIES[elements.priority.value] || PRIORITIES.effizient;
    }

    function getDieselPrice() {
        return Number(elements.dieselPrice.value.replace(",", "."));
    }

    function updateSelectedTruckDetails() {
        const truck = getSelectedTruck();
        elements.selectedTruckName.textContent = truck.name;
        elements.selectedTruckDetails.textContent = `${formatNumber(truck.consumption, 0)} l / 100 km · ${truck.description}`;
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
