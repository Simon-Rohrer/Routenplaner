(function () {
    const DEFAULT_VIEW = {
        center: [51.1657, 10.4515],
        zoom: 6
    };

    const ROUTING_SERVICE_URL = "https://router.project-osrm.org/route/v1";
    const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
    const DEFAULT_DIESEL_PRICE = 1.70;

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

    const DEFAULT_DRIVERS = [
        {
            id: "fahrer-001",
            name: "Simon Keller",
            hourlyRate: 28,
            status: "aktiv"
        },
        {
            id: "fahrer-002",
            name: "Marcel Bauer",
            hourlyRate: 30,
            status: "aktiv"
        },
        {
            id: "fahrer-003",
            name: "Sebastian Weber",
            hourlyRate: 32,
            status: "aktiv"
        }
    ];

    const DEFAULT_PACKAGE_TYPES = [
        {
            type: "Manuelle Eingabe",
            volumeM3: null,
            baseWeightKg: null
        },
        {
            type: "Kleinpaket",
            volumeM3: 0.03,
            baseWeightKg: 5
        },
        {
            type: "Europalette",
            volumeM3: 1.2,
            baseWeightKg: 250
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
        activeSuggestionRequest: null,
        currentStep: 0,
        drivers: DEFAULT_DRIVERS.slice(),
        packageTypes: DEFAULT_PACKAGE_TYPES.slice(),
        csvWriteEnabled: false,
        csvSourceLabel: "Fallback-Daten"
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", initApp);

    function initApp() {
        cacheElements();
        renderTruckOptions("sprinter");
        renderDriverOptions();
        renderPackageTypeOptions();
        initMap();
        bindEvents();
        loadCsvData();
    }

    function cacheElements() {
        elements.newRouteButton = document.getElementById("new-route-btn");
        elements.routeDialog = document.getElementById("route-dialog");
        elements.dialogCloseButton = document.getElementById("dialog-close-btn");
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
        elements.packageType = document.getElementById("package-type");
        elements.priority = document.getElementById("priority");
        elements.dieselPrice = document.getElementById("diesel-price");
        elements.driverSelect = document.getElementById("driver");
        elements.truckOptions = document.getElementById("truck-options");
        elements.selectedTruckName = document.getElementById("selected-truck-name");
        elements.selectedTruckDetails = document.getElementById("selected-truck-details");
        elements.calculateButton = document.getElementById("calculate-btn");
        elements.clearButton = document.getElementById("clear-btn");
        elements.wizardBackButton = document.getElementById("wizard-back-btn");
        elements.wizardNextButton = document.getElementById("wizard-next-btn");
        elements.wizardStepButtons = Array.from(document.querySelectorAll("[data-step-target]"));
        elements.wizardPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
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
        elements.summaryDriver = document.getElementById("summary-driver");
        elements.summaryCost = document.getElementById("summary-cost");
        elements.fuelLiters = document.getElementById("fuel-liters");
        elements.fuelInfo = document.getElementById("fuel-info");
        elements.cost = document.getElementById("cost");
        elements.costInfo = document.getElementById("cost-info");
        elements.bwlCosts = document.getElementById("bwl-costs");
        elements.bwlBenefits = document.getElementById("bwl-benefits");
        elements.recommendationTitle = document.getElementById("recommendation-title");
        elements.recommendationText = document.getElementById("recommendation-text");
        elements.csvStatus = document.getElementById("csv-status");
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
        elements.newRouteButton.addEventListener("click", function () {
            openRouteDialog(true);
        });

        elements.dialogCloseButton.addEventListener("click", closeRouteDialog);

        elements.routeDialog.addEventListener("click", function (event) {
            if (event.target === elements.routeDialog) {
                closeRouteDialog();
            }
        });

        elements.wizardStepButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setWizardStep(Number(button.dataset.stepTarget));
            });
        });

        elements.wizardBackButton.addEventListener("click", function () {
            setWizardStep(state.currentStep - 1);
        });

        elements.wizardNextButton.addEventListener("click", function () {
            setWizardStep(state.currentStep + 1);
        });

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
        elements.driverSelect.addEventListener("change", refreshCostPlanFromCurrentRoute);
        elements.packageType.addEventListener("change", applySelectedPackageType);
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

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !elements.routeDialog.hidden) {
                closeRouteDialog();
            }
        });

        document.addEventListener("pointerdown", function (event) {
            if (!event.target.closest(".autocomplete-wrapper")) {
                closeSuggestions();
            }
        });

        updateSelectedTruckDetails();
        setWizardStep(0);
    }

    function openRouteDialog(resetPlanner) {
        if (resetPlanner) {
            clearPlanner();
        }

        elements.routeDialog.hidden = false;
        document.body.classList.add("dialog-open");
        setWizardStep(0);

        window.requestAnimationFrame(function () {
            elements.startInput.focus();
        });
    }

    function closeRouteDialog() {
        elements.routeDialog.hidden = true;
        document.body.classList.remove("dialog-open");
        closeSuggestions();
        elements.newRouteButton.focus();
    }

    function setWizardStep(nextStep) {
        const maxStep = elements.wizardPanels.length - 1;
        const safeStep = Math.min(Math.max(nextStep, 0), maxStep);

        state.currentStep = safeStep;

        elements.wizardPanels.forEach(function (panel, index) {
            panel.classList.toggle("is-active", index === safeStep);
        });

        elements.wizardStepButtons.forEach(function (button, index) {
            const isActive = index === safeStep;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-current", isActive ? "step" : "false");
        });

        elements.wizardBackButton.disabled = safeStep === 0;
        elements.wizardNextButton.hidden = safeStep === maxStep;
        elements.calculateButton.hidden = safeStep !== maxStep;
    }

    async function loadCsvData() {
        setCsvStatus("CSV-Datenquelle wird geladen.");

        try {
            const response = await fetch("api/csv", {
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("CSV-API nicht erreichbar.");
            }

            const data = await response.json();
            applyCsvData(data, true);
            setCsvStatus("CSV-Daten aktiv: Lesen und Schreiben ist verbunden.");
        } catch (apiError) {
            try {
                const data = await loadStaticCsvData();
                applyCsvData(data, false);
                setCsvStatus("CSV-Daten gelesen. Schreiben benötigt den lokalen server.py.");
            } catch (staticError) {
                state.csvWriteEnabled = false;
                state.csvSourceLabel = "Fallback-Daten";
                setCsvStatus("CSV-Daten konnten nicht geladen werden. Fallback-Daten aktiv.");
            }
        }
    }

    async function loadStaticCsvData() {
        const [fahrer, fahrzeuge, pakete, fahrten] = await Promise.all([
            fetchCsvRows("CSV/Fahrer.csv"),
            fetchCsvRows("CSV/Fahrzeug.csv"),
            fetchCsvRows("CSV/Paket.csv"),
            fetchCsvRows("CSV/Fahrtenverlauf.csv")
        ]);

        return {
            fahrer,
            fahrzeuge,
            pakete,
            fahrten
        };
    }

    async function fetchCsvRows(path) {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`CSV konnte nicht geladen werden: ${path}`);
        }

        return parseCsv(await response.text());
    }

    function parseCsv(csvText) {
        const rows = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (line) {
            return line.trim().length > 0;
        });

        if (!rows.length) {
            return [];
        }

        const headers = splitCsvLine(rows[0]);

        return rows.slice(1).map(function (line) {
            const values = splitCsvLine(line);
            return headers.reduce(function (row, header, index) {
                row[header] = values[index] || "";
                return row;
            }, {});
        });
    }

    function splitCsvLine(line) {
        const values = [];
        let currentValue = "";
        let isQuoted = false;

        for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            const nextChar = line[index + 1];

            if (char === "\"" && isQuoted && nextChar === "\"") {
                currentValue += "\"";
                index += 1;
                continue;
            }

            if (char === "\"") {
                isQuoted = !isQuoted;
                continue;
            }

            if (char === ";" && !isQuoted) {
                values.push(currentValue);
                currentValue = "";
                continue;
            }

            currentValue += char;
        }

        values.push(currentValue);
        return values;
    }

    function applyCsvData(data, canWrite) {
        const mappedVehicles = (data.fahrzeuge || []).map(mapCsvVehicle).filter(Boolean);
        const activeVehicles = mappedVehicles.filter(function (vehicle) {
            return vehicle.status !== "inaktiv";
        });
        const mappedDrivers = (data.fahrer || []).map(mapCsvDriver).filter(Boolean);
        const activeDrivers = mappedDrivers.filter(function (driver) {
            return driver.status !== "inaktiv";
        });
        const mappedPackageTypes = (data.pakete || []).map(mapCsvPackageType).filter(Boolean);

        if (activeVehicles.length) {
            VEHICLES.splice(0, VEHICLES.length, ...activeVehicles);
            renderTruckOptions(getSelectedTruck().id);
        }

        if (activeDrivers.length) {
            state.drivers = activeDrivers;
            renderDriverOptions();
        }

        if (mappedPackageTypes.length) {
            state.packageTypes = [
                {
                    type: "Manuelle Eingabe",
                    volumeM3: null,
                    baseWeightKg: null
                },
                ...mappedPackageTypes
            ];
            renderPackageTypeOptions();
        }

        state.csvWriteEnabled = canWrite;
        state.csvSourceLabel = canWrite ? "CSV-API" : "CSV-Dateien";
        updateSelectedTruckDetails();
        refreshCostPlanFromCurrentRoute();
    }

    function mapCsvVehicle(row) {
        const id = String(row.Fahrzeug_ID || "").trim();
        const baseVehicle = VEHICLES.find(function (vehicle) {
            return vehicle.id === id;
        });
        const volumeM3 = parseCsvNumber(row.Stauraum_m3);
        const fuelCostPerKm = parseCsvNumber(row.Sprit_pro_km_EUR);
        const insurancePerDay = parseCsvNumber(row.Versicherung_Tag_EUR);

        if (!id || !String(row.Modell || "").trim()) {
            return null;
        }

        return {
            ...(baseVehicle || createVehicleFallback(id, volumeM3)),
            id,
            name: String(row.Modell).trim(),
            volumeM3: Number.isFinite(volumeM3) ? volumeM3 : (baseVehicle ? baseVehicle.volumeM3 : 8),
            consumption: Number.isFinite(fuelCostPerKm) && fuelCostPerKm > 0
                ? fuelCostPerKm / DEFAULT_DIESEL_PRICE * 100
                : (baseVehicle ? baseVehicle.consumption : 11),
            insurancePerDay: Number.isFinite(insurancePerDay) ? insurancePerDay : 0,
            status: String(row.Status || "aktiv").trim().toLowerCase()
        };
    }

    function createVehicleFallback(id, volumeM3) {
        const safeVolume = Number.isFinite(volumeM3) && volumeM3 > 0 ? volumeM3 : 8;
        const sideCm = Math.max(120, Math.round(Math.cbrt(safeVolume) * 100));

        return {
            id,
            name: id,
            category: "CSV-Fahrzeug",
            consumption: 11,
            payloadKg: Math.max(600, Math.round(safeVolume * 180)),
            volumeM3: safeVolume,
            cargoLengthCm: sideCm,
            cargoWidthCm: Math.max(160, Math.round(sideCm * 0.75)),
            cargoHeightCm: Math.max(140, Math.round(sideCm * 0.75)),
            purchaseCost: 52000,
            maintenancePerYear: 3200,
            trainingCost: 750,
            personnelHourlyRate: 29,
            description: "Fahrzeug aus CSV-Datei",
            strength: "direkt aus der Fahrzeugliste übernommen",
            speedScore: 7,
            annualTrips: 520,
            depreciationYears: 6,
            trainingYears: 3
        };
    }

    function mapCsvDriver(row) {
        const id = String(row.Fahrer_ID || "").trim();
        const name = String(row.Name || "").trim();
        const hourlyRate = parseCsvNumber(row.Stundenlohn_EUR);

        if (!id || !name || !Number.isFinite(hourlyRate)) {
            return null;
        }

        return {
            id,
            name,
            hourlyRate,
            status: String(row.Status || "aktiv").trim().toLowerCase()
        };
    }

    function mapCsvPackageType(row) {
        const type = String(row.Typ || "").trim();
        const volumeM3 = parseCsvNumber(row.Volumen_m3);
        const baseWeightKg = parseCsvNumber(row.Basis_Gewicht_kg);

        if (!type || !Number.isFinite(volumeM3) || !Number.isFinite(baseWeightKg)) {
            return null;
        }

        return {
            type,
            volumeM3,
            baseWeightKg
        };
    }

    function parseCsvNumber(value) {
        return Number(String(value || "").replace(",", "."));
    }

    function renderTruckOptions(selectedTruckId) {
        const preferredTruckId = selectedTruckId || "sprinter";
        elements.truckOptions.innerHTML = "";

        VEHICLES.forEach(function (truck, index) {
            const label = document.createElement("label");
            const input = document.createElement("input");
            const content = document.createElement("span");
            const name = document.createElement("span");
            const meta = document.createElement("span");

            label.className = "truck-option";
            input.type = "radio";
            input.name = "truck";
            input.value = truck.id;
            input.checked = truck.id === preferredTruckId || (!VEHICLES.some(function (vehicle) {
                return vehicle.id === preferredTruckId;
            }) && index === 0);
            content.className = "truck-option-content";
            name.className = "truck-option-name";
            meta.className = "truck-option-meta";
            name.textContent = truck.name;
            meta.textContent = `${formatNumber(truck.payloadKg, 0)} kg · ${formatNumber(truck.volumeM3, 1)} m³ · ${formatNumber(truck.consumption, 1)} l / 100 km`;
            content.append(name, meta);
            label.append(input, content);
            elements.truckOptions.appendChild(label);
        });
    }

    function renderDriverOptions() {
        elements.driverSelect.innerHTML = "";

        state.drivers.forEach(function (driver, index) {
            const option = document.createElement("option");
            option.value = driver.id;
            option.textContent = `${driver.name} · ${formatCurrency(driver.hourlyRate)} / h`;
            option.selected = index === 0;
            elements.driverSelect.appendChild(option);
        });
    }

    function renderPackageTypeOptions() {
        elements.packageType.innerHTML = "";

        state.packageTypes.forEach(function (packageType, index) {
            const option = document.createElement("option");
            option.value = packageType.type;
            option.textContent = packageType.volumeM3
                ? `${packageType.type} · ${formatNumber(packageType.volumeM3, 2)} m³ · ${formatNumber(packageType.baseWeightKg, 1)} kg`
                : packageType.type;
            option.selected = index === 0;
            elements.packageType.appendChild(option);
        });
    }

    function applySelectedPackageType() {
        const selectedType = state.packageTypes.find(function (packageType) {
            return packageType.type === elements.packageType.value;
        });

        if (!selectedType || selectedType.type === "Manuelle Eingabe") {
            refreshCostPlanFromCurrentRoute();
            return;
        }

        const sideCm = Math.max(10, Math.round(Math.cbrt(selectedType.volumeM3) * 100));
        elements.packageLength.value = String(sideCm);
        elements.packageWidth.value = String(sideCm);
        elements.packageHeight.value = String(sideCm);
        elements.packageWeight.value = String(selectedType.baseWeightKg);
        refreshCostPlanFromCurrentRoute();
    }

    function setCsvStatus(message) {
        if (elements.csvStatus) {
            elements.csvStatus.textContent = message;
        }
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
            closeRouteDialog();
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
            color: "#ffffff",
            opacity: 0.86,
            weight: 12,
            lineCap: "round",
            lineJoin: "round",
            interactive: false
        }).addTo(state.map);

        const routeLine = L.polyline(coordinates, {
            className: isFallback ? "route-line route-line-fallback" : "route-line",
            color: "#ef4444",
            dashArray: isFallback ? "12 10" : null,
            opacity: 1,
            weight: 7,
            lineCap: "round",
            lineJoin: "round"
        }).addTo(state.map);

        shadowLine.bringToFront();
        routeLine.bringToFront();
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
        saveTripToCsv(costPlan);
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
        saveTripToCsv(costPlan);
    }

    // Planungslogik für den Schul-Prototyp: Paket, Fahrzeugdaten, Strecke und BWL-Kosten.
    function calculateCostPlan(distanceKm, durationSeconds) {
        const selectedTruck = getSelectedTruck();
        const selectedDriver = getSelectedDriver();
        const priority = getSelectedPriority();
        const dieselPrice = getDieselPrice();
        const packageData = getPackageData();
        const recommendation = getVehicleRecommendation(priority, packageData);
        const plannedTruck = recommendation.truck;
        const consumedLiters = distanceKm / 100 * plannedTruck.consumption;
        const fuelCost = consumedLiters * dieselPrice * priority.factor;
        const durationHours = Math.max(durationSeconds / 3600, distanceKm / 70);
        const bwlCosts = calculateBwlCosts(plannedTruck, selectedDriver, durationHours);
        const totalCost = fuelCost + bwlCosts.total;
        const benefits = calculateBenefits(priority, plannedTruck, durationHours, totalCost);

        return {
            selectedTruck,
            selectedDriver,
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
        const start = formatCompactAddressLabel(elements.startInput.value) || "Start";
        const ziel = formatCompactAddressLabel(elements.zielInput.value) || "Ziel";

        elements.summaryRoute.textContent = `${start} nach ${ziel}`;
        elements.summaryPackage.textContent = `${plan.packageData.quantity} Paket(e), ${formatNumber(plan.packageData.totalWeightKg, 1)} kg`;
        elements.summaryVehicle.textContent = plan.plannedTruck.name;
        elements.summaryDriver.textContent = plan.selectedDriver ? plan.selectedDriver.name : "-";
        elements.summaryCost.textContent = formatCurrency(plan.totalCost);
    }

    function formatCompactAddressLabel(value) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "";
        }

        const parts = trimmedValue.split(",").map(function (part) {
            return part.trim();
        }).filter(Boolean);
        const compactLabel = parts[0] || trimmedValue;

        return shortenText(compactLabel, 32);
    }

    function shortenText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 3).trim()}...`;
    }

    async function saveTripToCsv(plan) {
        if (!state.csvWriteEnabled) {
            setCsvStatus("CSV gelesen. Fahrten speichern funktioniert erst mit dem lokalen server.py.");
            return;
        }

        try {
            const response = await fetch("api/fahrten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    datum: new Date().toISOString().slice(0, 10),
                    fahrzeugId: plan.plannedTruck.id,
                    fahrerId: plan.selectedDriver ? plan.selectedDriver.id : "",
                    startort: elements.startInput.value.trim(),
                    zielort: elements.zielInput.value.trim(),
                    kostenGesamtEur: formatNumber(plan.totalCost, 2)
                })
            });

            if (!response.ok) {
                throw new Error("Fahrt konnte nicht gespeichert werden.");
            }

            setCsvStatus("Fahrt wurde in CSV/Fahrtenverlauf.csv gespeichert.");
        } catch (error) {
            setCsvStatus("Fahrt konnte nicht in die CSV-Datei geschrieben werden.");
        }
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

    function calculateBwlCosts(vehicle, driver, durationHours) {
        const acquisitionShare = vehicle.purchaseCost / vehicle.depreciationYears / vehicle.annualTrips;
        const maintenanceShare = vehicle.maintenancePerYear / vehicle.annualTrips;
        const trainingShare = vehicle.trainingCost / vehicle.trainingYears / vehicle.annualTrips;
        const insuranceShare = Number(vehicle.insurancePerDay) || 0;
        const hourlyRate = driver ? driver.hourlyRate : vehicle.personnelHourlyRate;
        const personnelCost = durationHours * hourlyRate;

        return {
            acquisitionShare,
            maintenanceShare,
            trainingShare,
            insuranceShare,
            personnelCost,
            total: acquisitionShare + maintenanceShare + trainingShare + insuranceShare + personnelCost
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
            ["Versicherungskosten", plan.bwlCosts.insuranceShare],
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
        elements.summaryDriver.textContent = "-";
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
        setWizardStep(0);

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

    function getSelectedDriver() {
        const selectedDriverId = elements.driverSelect.value;
        return state.drivers.find(function (driver) {
            return driver.id === selectedDriverId;
        }) || state.drivers[0] || null;
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
