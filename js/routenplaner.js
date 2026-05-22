(function () {
    const DEFAULT_VIEW = {
        center: [51.1657, 10.4515],
        zoom: 6
    };

    const ROUTING_SERVICE_URL = "https://router.project-osrm.org/route/v1";
    const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

    const VEHICLES = [
        {
            id: "vito",
            name: "Mercedes-Benz Vito",
            category: "Transporter",
            consumption: 8.5,
            payloadKg: 900,
            volumeM3: 6,
            cargoLengthCm: 260,
            cargoWidthCm: 165,
            cargoHeightCm: 135,
            purchaseCost: 42000,
            maintenancePerYear: 2400,
            trainingCost: 600,
            personnelHourlyRate: 28,
            description: "kleiner Transporter für leichte Pakete und Stadtfahrten",
            strength: "sehr niedrige Betriebskosten bei kleinen Sendungen",
            speedScore: 9,
            annualTrips: 620,
            depreciationYears: 6,
            trainingYears: 3
        },
        {
            id: "sprinter",
            name: "Mercedes-Benz Sprinter",
            category: "3,5-t-Kastenwagen",
            consumption: 10.5,
            payloadKg: 1200,
            volumeM3: 14,
            cargoLengthCm: 430,
            cargoWidthCm: 178,
            cargoHeightCm: 194,
            purchaseCost: 56000,
            maintenancePerYear: 3200,
            trainingCost: 750,
            personnelHourlyRate: 29,
            description: "flexibler Kastenwagen für Paket- und Palettenlieferungen",
            strength: "guter Kompromiss aus Nutzlast, Volumen und Verbrauch",
            speedScore: 8,
            annualTrips: 580,
            depreciationYears: 6,
            trainingYears: 3
        },
        {
            id: "crafter",
            name: "Volkswagen Crafter",
            category: "3,5-t-Kastenwagen",
            consumption: 10.8,
            payloadKg: 1300,
            volumeM3: 16.4,
            cargoLengthCm: 485,
            cargoWidthCm: 183,
            cargoHeightCm: 196,
            purchaseCost: 59000,
            maintenancePerYear: 3400,
            trainingCost: 750,
            personnelHourlyRate: 29,
            description: "großer Kastenwagen mit viel Ladevolumen",
            strength: "mehr Volumen als der Sprinter bei noch moderatem Verbrauch",
            speedScore: 8,
            annualTrips: 560,
            depreciationYears: 6,
            trainingYears: 3
        },
        {
            id: "daily-72",
            name: "Iveco Daily 7,2 t",
            category: "leichter 7,2-t-LKW",
            consumption: 15.5,
            payloadKg: 3500,
            volumeM3: 28,
            cargoLengthCm: 610,
            cargoWidthCm: 220,
            cargoHeightCm: 230,
            purchaseCost: 78000,
            maintenancePerYear: 5200,
            trainingCost: 1200,
            personnelHourlyRate: 31,
            description: "kleiner LKW für schwere Pakete und mehrere Paletten",
            strength: "viel Nutzlast, ohne direkt einen großen 12-t-LKW einzusetzen",
            speedScore: 7,
            annualTrips: 500,
            depreciationYears: 7,
            trainingYears: 3
        },
        {
            id: "man-tgl-75",
            name: "MAN TGL 7,5 t",
            category: "7,5-t-LKW",
            consumption: 18,
            payloadKg: 3000,
            volumeM3: 35,
            cargoLengthCm: 720,
            cargoWidthCm: 245,
            cargoHeightCm: 240,
            purchaseCost: 95000,
            maintenancePerYear: 6500,
            trainingCost: 1500,
            personnelHourlyRate: 32,
            description: "klassischer 7,5-Tonner für größere Touren",
            strength: "großes Ladevolumen für sperrige Lieferungen",
            speedScore: 6,
            annualTrips: 460,
            depreciationYears: 7,
            trainingYears: 3
        },
        {
            id: "atego-12",
            name: "Mercedes-Benz Atego 12 t",
            category: "12-t-Verteiler-LKW",
            consumption: 22,
            payloadKg: 6000,
            volumeM3: 44,
            cargoLengthCm: 800,
            cargoWidthCm: 245,
            cargoHeightCm: 260,
            purchaseCost: 125000,
            maintenancePerYear: 8200,
            trainingCost: 1800,
            personnelHourlyRate: 34,
            description: "größerer Verteiler-LKW für schwere oder voluminöse Sendungen",
            strength: "Reserve, wenn 7,5 Tonnen nicht mehr reichen",
            speedScore: 5,
            annualTrips: 430,
            depreciationYears: 8,
            trainingYears: 3
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
        elements.packageLength = document.getElementById("package-length");
        elements.packageWidth = document.getElementById("package-width");
        elements.packageHeight = document.getElementById("package-height");
        elements.packageWeight = document.getElementById("package-weight");
        elements.packageQuantity = document.getElementById("package-quantity");
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
        elements.resultPackage = document.getElementById("result-package");
        elements.resultLoad = document.getElementById("result-load");
        elements.summaryRoute = document.getElementById("summary-route");
        elements.summaryPackage = document.getElementById("summary-package");
        elements.summaryVehicle = document.getElementById("summary-vehicle");
        elements.summaryCost = document.getElementById("summary-cost");
        elements.fuelLiters = document.getElementById("fuel-liters");
        elements.fuelInfo = document.getElementById("fuel-info");
        elements.cost = document.getElementById("cost");
        elements.costInfo = document.getElementById("cost-info");
        elements.bwlCosts = document.getElementById("bwl-costs");
        elements.bwlBenefits = document.getElementById("bwl-benefits");
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
        [
            elements.packageLength,
            elements.packageWidth,
            elements.packageHeight,
            elements.packageWeight,
            elements.packageQuantity
        ].forEach(function (input) {
            input.addEventListener("input", refreshCostPlanFromCurrentRoute);
        });

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
        const packageData = getPackageData();

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

        if (!packageData.isValid) {
            showRouteError("Bitte gültige Paketmaße, Gewicht und Anzahl eingeben.");
        }

        if (!startAddress || !zielAddress || !Number.isFinite(dieselPrice) || dieselPrice <= 0 || !packageData.isValid) {
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
        const packageData = getPackageData();

        elements.results.hidden = false;
        elements.distance.textContent = "-";
        elements.duration.textContent = "Wird berechnet";
        elements.routeInfo.textContent = "Routingdaten werden geladen.";
        elements.resultTruck.textContent = getSelectedTruck().name;
        elements.resultTruckInfo.textContent = "Fahrzeugvorschlag wird nach Paket- und Routendaten berechnet.";
        elements.resultPackage.textContent = packageData.isValid ? `${packageData.quantity} Paket(e)` : "-";
        elements.resultLoad.textContent = packageData.isValid
            ? `${formatNumber(packageData.totalWeightKg, 1)} kg Gesamtgewicht · ${formatNumber(packageData.totalVolumeM3, 2)} m³ Volumen`
            : "";
        elements.fuelLiters.textContent = "-";
        elements.fuelInfo.textContent = "";
        elements.cost.textContent = "-";
        elements.costInfo.textContent = "";
        elements.bwlCosts.innerHTML = "";
        elements.bwlBenefits.innerHTML = "";
        elements.summaryRoute.textContent = "Route wird berechnet";
        elements.summaryPackage.textContent = packageData.isValid ? `${formatNumber(packageData.totalWeightKg, 1)} kg · ${formatNumber(packageData.totalVolumeM3, 2)} m³` : "-";
        elements.summaryVehicle.textContent = "Wird geprüft";
        elements.summaryCost.textContent = "-";
        elements.recommendationTitle.textContent = "Planungslogik wird ausgewertet";
        elements.recommendationText.textContent = "Der Rechner vergleicht Paketmaße, Gewicht, Fahrzeugkosten und Streckenlänge.";
    }

    function renderRouteMetrics(distanceMeters, durationSeconds, sourceLabel) {
        const distanceKm = distanceMeters / 1000;
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
        const averageSpeed = Math.round(distanceKm / (durationSeconds / 3600));
        const costPlan = calculateCostPlan(distanceKm, durationSeconds);

        state.currentResult = {
            distanceKm,
            durationSeconds,
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
        const estimatedDurationSeconds = distanceKm / 65 * 3600;
        const costPlan = calculateCostPlan(distanceKm, estimatedDurationSeconds);

        state.currentResult = {
            distanceKm,
            durationSeconds: estimatedDurationSeconds,
            routeInfo: "Luftlinien-Entfernung ohne Fahrzeit."
        };

        elements.results.hidden = false;
        elements.distance.textContent = distanceKm.toFixed(2);
        elements.duration.textContent = "Nicht verfügbar";
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
    }

    // Planungslogik für den Schul-Prototyp: Paket, Fahrzeugdaten, Strecke und BWL-Kosten.
    function calculateCostPlan(distanceKm, durationSeconds) {
        const selectedTruck = getSelectedTruck();
        const priority = getSelectedPriority();
        const dieselPrice = getDieselPrice();
        const packageData = getPackageData();
        const recommendation = getVehicleRecommendation(priority, packageData);
        const plannedTruck = recommendation.truck;
        const consumedLiters = distanceKm / 100 * plannedTruck.consumption;
        const fuelCost = consumedLiters * dieselPrice * priority.factor;
        const durationHours = Math.max(durationSeconds / 3600, distanceKm / 70);
        const bwlCosts = calculateBwlCosts(plannedTruck, durationHours);
        const totalCost = fuelCost + bwlCosts.total;
        const benefits = calculateBenefits(priority, plannedTruck, durationHours, totalCost);

        return {
            selectedTruck,
            plannedTruck,
            priority,
            dieselPrice,
            packageData,
            distanceKm,
            durationHours,
            consumedLiters,
            fuelCost,
            totalCost,
            bwlCosts,
            benefits,
            recommendation
        };
    }

    function renderCostPlan(plan) {
        elements.resultTruck.textContent = plan.plannedTruck.name;
        elements.resultTruckInfo.textContent = `${plan.plannedTruck.category} · ${formatNumber(plan.plannedTruck.payloadKg, 0)} kg Nutzlast · ${formatNumber(plan.plannedTruck.volumeM3, 1)} m³ · ${formatNumber(plan.plannedTruck.consumption, 1)} l / 100 km`;
        elements.resultPackage.textContent = `${plan.packageData.quantity} Paket(e)`;
        elements.resultLoad.textContent = `${formatNumber(plan.packageData.totalWeightKg, 1)} kg Gesamtgewicht · ${formatNumber(plan.packageData.totalVolumeM3, 2)} m³ Volumen · Einzelmaß ${formatNumber(plan.packageData.lengthCm, 0)} × ${formatNumber(plan.packageData.widthCm, 0)} × ${formatNumber(plan.packageData.heightCm, 0)} cm`;
        elements.fuelLiters.textContent = formatNumber(plan.consumedLiters, 1);
        elements.fuelInfo.textContent = `${formatNumber(plan.distanceKm, 2)} km × ${formatNumber(plan.plannedTruck.consumption, 1)} l / 100 km × Faktor ${formatNumber(plan.priority.factor, 2)} (${plan.priority.label})`;
        elements.cost.textContent = formatCurrency(plan.totalCost);
        elements.costInfo.textContent = `${formatCurrency(plan.fuelCost)} Kraftstoff + ${formatCurrency(plan.bwlCosts.total)} BWL-Kostenanteile pro Fahrt.`;
        renderBwlBreakdown(plan);
        renderSummary(plan);
        elements.recommendationTitle.textContent = `Empfehlung: ${plan.recommendation.truck.name}`;
        elements.recommendationText.textContent = buildRecommendationText(plan);
    }

    function renderSummary(plan) {
        const start = elements.startInput.value.trim() || "Start";
        const ziel = elements.zielInput.value.trim() || "Ziel";

        elements.summaryRoute.textContent = `${start} nach ${ziel}`;
        elements.summaryPackage.textContent = `${plan.packageData.quantity} Paket(e), ${formatNumber(plan.packageData.totalWeightKg, 1)} kg`;
        elements.summaryVehicle.textContent = plan.plannedTruck.name;
        elements.summaryCost.textContent = formatCurrency(plan.totalCost);
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

        const packageData = getPackageData();

        if (!packageData.isValid) {
            showRouteError("Bitte gültige Paketmaße, Gewicht und Anzahl eingeben.");
            return;
        }

        const costPlan = calculateCostPlan(state.currentResult.distanceKm, state.currentResult.durationSeconds);
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
        clearErrors();
    }

    function buildRecommendationText(plan) {
        const selectedIsRecommended = plan.selectedTruck.id === plan.recommendation.truck.id;
        const selectionText = selectedIsRecommended
            ? "Das ausgewählte Fahrzeug passt zu Paket und Priorität."
            : `Ausgewählt ist ${plan.selectedTruck.name}; die Planungslogik würde ${plan.recommendation.truck.name} einsetzen.`;

        return `${selectionText} ${plan.recommendation.reason} Für die BWL-Auswertung werden Anschaffung, Wartung, Schulung und Personal anteilig pro Fahrt berücksichtigt. Der geschätzte Gesamtaufwand liegt bei ${formatCurrency(plan.totalCost)}.`;
    }

    function getVehicleRecommendation(priority, packageData) {
        const fittingVehicles = VEHICLES.filter(function (vehicle) {
            return canVehicleCarryPackage(vehicle, packageData);
        });
        const candidates = fittingVehicles.length ? fittingVehicles : [VEHICLES[VEHICLES.length - 1]];

        if (!fittingVehicles.length) {
            const truck = VEHICLES[VEHICLES.length - 1];

            return {
                truck,
                reason: `Kein Fahrzeug in der Liste passt vollständig zu Gewicht, Volumen oder Einzelmaß. ${truck.name} ist deshalb die größte verfügbare Ausweichlösung.`
            };
        }

        if (priority === PRIORITIES.schnell) {
            const truck = candidates.reduce(function (bestTruck, truckItem) {
                return truckItem.speedScore > bestTruck.speedScore ? truckItem : bestTruck;
            }, candidates[0]);

            return {
                truck,
                reason: `${truck.name} ist bei Priorität schnell sinnvoll, weil ${truck.strength}.`
            };
        }

        if (priority === PRIORITIES.effizient) {
            const truck = candidates.reduce(function (bestTruck, truckItem) {
                const truckScore = getVehicleEfficiencyScore(truckItem, packageData);
                const bestScore = getVehicleEfficiencyScore(bestTruck, packageData);
                return truckScore < bestScore ? truckItem : bestTruck;
            }, candidates[0]);

            return {
                truck,
                reason: `${truck.name} bietet den besten Kompromiss, weil er die Sendung aufnehmen kann und ${truck.strength}.`
            };
        }

        const truck = candidates.reduce(function (bestTruck, truckItem) {
            return truckItem.consumption < bestTruck.consumption ? truckItem : bestTruck;
        }, candidates[0]);

        return {
            truck,
            reason: `${truck.name} ist die günstigste passende Empfehlung, weil er mit ${formatNumber(truck.consumption, 1)} l / 100 km den niedrigsten Verbrauch unter den passenden Fahrzeugen hat.`
        };
    }

    function canVehicleCarryPackage(vehicle, packageData) {
        if (!packageData.isValid) {
            return false;
        }

        return packageData.totalWeightKg <= vehicle.payloadKg
            && packageData.totalVolumeM3 <= vehicle.volumeM3
            && packageData.lengthCm <= vehicle.cargoLengthCm
            && packageData.widthCm <= vehicle.cargoWidthCm
            && packageData.heightCm <= vehicle.cargoHeightCm;
    }

    function getVehicleEfficiencyScore(vehicle, packageData) {
        const weightUsage = packageData.totalWeightKg / vehicle.payloadKg;
        const volumeUsage = packageData.totalVolumeM3 / vehicle.volumeM3;
        const usagePenalty = Math.abs(0.72 - Math.max(weightUsage, volumeUsage)) * 6;

        return vehicle.consumption + usagePenalty - vehicle.speedScore * 0.2;
    }

    function calculateBwlCosts(vehicle, durationHours) {
        const acquisitionShare = vehicle.purchaseCost / vehicle.depreciationYears / vehicle.annualTrips;
        const maintenanceShare = vehicle.maintenancePerYear / vehicle.annualTrips;
        const trainingShare = vehicle.trainingCost / vehicle.trainingYears / vehicle.annualTrips;
        const personnelCost = durationHours * vehicle.personnelHourlyRate;

        return {
            acquisitionShare,
            maintenanceShare,
            trainingShare,
            personnelCost,
            total: acquisitionShare + maintenanceShare + trainingShare + personnelCost
        };
    }

    function calculateBenefits(priority, vehicle, durationHours, totalCost) {
        const baseTimeSavingFactor = priority === PRIORITIES.schnell ? 0.18 : priority === PRIORITIES.effizient ? 0.12 : 0.08;
        const timeSavedMinutes = durationHours * 60 * baseTimeSavingFactor;
        const efficiencyGainPercent = priority === PRIORITIES.effizient ? 16 : priority === PRIORITIES.schnell ? 12 : 10;
        const errorReductionPercent = 18;
        const revenuePotential = totalCost * (priority === PRIORITIES.schnell ? 0.18 : 0.12);

        return {
            timeSavedMinutes,
            efficiencyGainPercent,
            errorReductionPercent,
            revenuePotential,
            explanation: `${vehicle.name} vermeidet unnötig große Fahrzeuge und reduziert dadurch Leerraum, Kraftstoffbedarf und Planungsfehler.`
        };
    }

    function renderBwlBreakdown(plan) {
        elements.bwlCosts.innerHTML = "";
        elements.bwlBenefits.innerHTML = "";

        [
            ["Anschaffungskosten", plan.bwlCosts.acquisitionShare],
            ["Wartungskosten", plan.bwlCosts.maintenanceShare],
            ["Schulungskosten", plan.bwlCosts.trainingShare],
            ["Personalkosten", plan.bwlCosts.personnelCost]
        ].forEach(function (item) {
            elements.bwlCosts.appendChild(createBreakdownItem(item[0], formatCurrency(item[1])));
        });

        [
            ["Zeitersparnis", `${formatNumber(plan.benefits.timeSavedMinutes, 0)} min`],
            ["Umsatzsteigerung", `${formatCurrency(plan.benefits.revenuePotential)} Potenzial`],
            ["Effizienz", `+${formatNumber(plan.benefits.efficiencyGainPercent, 0)} %`],
            ["Fehlerreduktion", `-${formatNumber(plan.benefits.errorReductionPercent, 0)} %`]
        ].forEach(function (item) {
            elements.bwlBenefits.appendChild(createBreakdownItem(item[0], item[1]));
        });
    }

    function createBreakdownItem(label, value) {
        const item = document.createElement("li");
        const labelElement = document.createElement("span");
        const valueElement = document.createElement("strong");

        labelElement.textContent = label;
        valueElement.textContent = value;
        item.append(labelElement, valueElement);

        return item;
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
        elements.resultPackage.textContent = "-";
        elements.resultLoad.textContent = "";
        elements.summaryRoute.textContent = "-";
        elements.summaryPackage.textContent = "-";
        elements.summaryVehicle.textContent = "-";
        elements.summaryCost.textContent = "-";
        elements.fuelLiters.textContent = "-";
        elements.fuelInfo.textContent = "";
        elements.cost.textContent = "-";
        elements.costInfo.textContent = "";
        elements.bwlCosts.innerHTML = "";
        elements.bwlBenefits.innerHTML = "";
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
        return VEHICLES.find(function (truck) {
            return truck.id === selectedTruckId;
        }) || VEHICLES[0];
    }

    function getSelectedPriority() {
        return PRIORITIES[elements.priority.value] || PRIORITIES.effizient;
    }

    function getDieselPrice() {
        return Number(elements.dieselPrice.value.replace(",", "."));
    }

    function getPackageData() {
        const lengthCm = getNumericInputValue(elements.packageLength);
        const widthCm = getNumericInputValue(elements.packageWidth);
        const heightCm = getNumericInputValue(elements.packageHeight);
        const weightKg = getNumericInputValue(elements.packageWeight);
        const quantity = Math.max(1, Math.round(getNumericInputValue(elements.packageQuantity)));
        const values = [lengthCm, widthCm, heightCm, weightKg, quantity];
        const isValid = values.every(function (value) {
            return Number.isFinite(value) && value > 0;
        });
        const singleVolumeM3 = isValid ? lengthCm / 100 * (widthCm / 100) * (heightCm / 100) : 0;

        return {
            isValid,
            lengthCm,
            widthCm,
            heightCm,
            weightKg,
            quantity,
            singleVolumeM3,
            totalVolumeM3: singleVolumeM3 * quantity,
            totalWeightKg: weightKg * quantity
        };
    }

    function getNumericInputValue(input) {
        return Number(String(input.value).replace(",", "."));
    }

    function updateSelectedTruckDetails() {
        const truck = getSelectedTruck();
        elements.selectedTruckName.textContent = truck.name;
        elements.selectedTruckDetails.textContent = `${formatNumber(truck.consumption, 1)} l / 100 km · ${formatNumber(truck.payloadKg, 0)} kg Nutzlast · ${formatNumber(truck.volumeM3, 1)} m³ Laderaum`;
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
