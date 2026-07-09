(function () {
    const DEFAULT_VIEW = {
        center: [51.1657, 10.4515],
        zoom: 6
    };

    const ROUTING_SERVICE_URL = "https://router.project-osrm.org/route/v1";
    const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
    const DEFAULT_DIESEL_PRICE = 1.70;
    const MAX_STOPS = 8;
    const TRIP_STORAGE_KEY = "paketpilot-fahrtenverlauf";
    const TRIP_CSV_HEADERS = [
        "Fahrt_ID",
        "Datum",
        "Fahrzeug_ID",
        "Fahrer_ID",
        "Startort",
        "Zielorte",
        "Kosten_Gesamt_EUR"
    ];

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
            insurancePerDay: 18,
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
            insurancePerDay: 22,
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
            insurancePerDay: 24,
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
            insurancePerDay: 35,
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
            insurancePerDay: 42,
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
            insurancePerDay: 55,
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
        currentRoute: null,
        currentStep: 0,
        stopCounter: 0,
        drivers: DEFAULT_DRIVERS.slice(),
        packageTypes: DEFAULT_PACKAGE_TYPES.slice(),
        csvWriteEnabled: false,
        trips: []
    };

    const elements = {};
    const resolvedAddresses = new WeakMap();
    const autocompleteTimers = new Map();
    const suggestionRequests = new Map();

    document.addEventListener("DOMContentLoaded", initApp);

    function initApp() {
        cacheElements();
        renderTruckOptions("auto");
        renderDriverOptions();
        renderPackageTypeOptions();
        addStopRow();
        initMap();
        bindEvents();
        loadCsvData();
        loadTripsFromStorage();
        renderTripLog();
    }

    function cacheElements() {
        elements.newRouteButton = document.getElementById("new-route-btn");
        elements.emptyStateButton = document.getElementById("empty-state-btn");
        elements.mapEmptyState = document.getElementById("map-empty-state");
        elements.routeDialog = document.getElementById("route-dialog");
        elements.dialogCloseButton = document.getElementById("dialog-close-btn");
        elements.form = document.getElementById("route-form");
        elements.startInput = document.getElementById("start");
        elements.startSuggestions = document.getElementById("start-suggestions");
        elements.startError = document.getElementById("start-error");
        elements.stopsList = document.getElementById("stops-list");
        elements.addStopButton = document.getElementById("add-stop-btn");
        elements.routeError = document.getElementById("route-error");
        elements.packageLength = document.getElementById("package-length");
        elements.packageWidth = document.getElementById("package-width");
        elements.packageHeight = document.getElementById("package-height");
        elements.packageWeight = document.getElementById("package-weight");
        elements.packageQuantity = document.getElementById("package-quantity");
        elements.packageType = document.getElementById("package-type");
        elements.priorityOptions = document.getElementById("priority-options");
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
        elements.overviewWindows = document.getElementById("overview-windows");
        elements.resultsHero = document.getElementById("results-hero");
        elements.resultsSide = document.getElementById("results-side");
        elements.resultsDetails = document.getElementById("results-details");
        elements.mapRow = document.getElementById("map-row");
        elements.routeChain = document.getElementById("route-chain");
        elements.heuristicBadgeText = document.getElementById("heuristic-badge-text");
        elements.heuristicVisual = document.getElementById("heuristic-visual");
        elements.distance = document.getElementById("distance");
        elements.distanceInfo = document.getElementById("distance-info");
        elements.duration = document.getElementById("duration");
        elements.routeInfo = document.getElementById("route-info");
        elements.resultTruck = document.getElementById("result-truck");
        elements.resultTruckInfo = document.getElementById("result-truck-info");
        elements.resultDriver = document.getElementById("result-driver");
        elements.resultPackage = document.getElementById("result-package");
        elements.resultLoad = document.getElementById("result-load");
        elements.fuelLiters = document.getElementById("fuel-liters");
        elements.fuelInfo = document.getElementById("fuel-info");
        elements.cost = document.getElementById("cost");
        elements.costInfo = document.getElementById("cost-info");
        elements.bwlCosts = document.getElementById("bwl-costs");
        elements.bwlBenefits = document.getElementById("bwl-benefits");
        elements.recommendationTitle = document.getElementById("recommendation-title");
        elements.recommendationText = document.getElementById("recommendation-text");
        elements.csvStatus = document.getElementById("csv-status");
        elements.tripLogBody = document.getElementById("trip-log-body");
        elements.tripCount = document.getElementById("trip-count");
        elements.tripDownloadButton = document.getElementById("trip-download-btn");
        elements.tripClearButton = document.getElementById("trip-clear-btn");
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

        if (elements.emptyStateButton) {
            elements.emptyStateButton.addEventListener("click", function () {
                openRouteDialog(true);
            });
        }

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
            if (!validateStep(state.currentStep)) {
                return;
            }
            clearErrors();
            setWizardStep(state.currentStep + 1);
        });

        elements.form.addEventListener("submit", function (event) {
            event.preventDefault();
            calculateRoute();
        });

        elements.clearButton.addEventListener("click", clearPlanner);
        elements.addStopButton.addEventListener("click", function () {
            const input = addStopRow();
            if (input) {
                input.focus();
            }
        });

        elements.truckOptions.addEventListener("change", function () {
            updateSelectedTruckDetails();
            refreshCostPlanFromCurrentRoute();
        });
        elements.priorityOptions.addEventListener("change", refreshCostPlanFromCurrentRoute);
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

        attachAutocomplete(elements.startInput, elements.startSuggestions);

        elements.tripDownloadButton.addEventListener("click", downloadTripsCsv);
        elements.tripClearButton.addEventListener("click", clearTripLog);

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

    // ----- Lieferorte (dynamische Zielliste) -----

    function addStopRow(prefillValue) {
        const existingRows = getStopRows();

        if (existingRows.length >= MAX_STOPS) {
            return null;
        }

        state.stopCounter += 1;
        const inputId = `stop-${state.stopCounter}`;

        const row = document.createElement("div");
        row.className = "form-group stop-row";

        const label = document.createElement("label");
        label.className = "stop-label";
        label.setAttribute("for", inputId);

        const line = document.createElement("div");
        line.className = "stop-input-line";

        const wrapper = document.createElement("div");
        wrapper.className = "autocomplete-wrapper";

        const input = document.createElement("input");
        input.type = "text";
        input.id = inputId;
        input.className = "stop-input";
        input.placeholder = "z. B. München, Deutschland";
        input.autocomplete = "off";
        input.spellcheck = false;
        if (prefillValue) {
            input.value = prefillValue;
        }

        const suggestions = document.createElement("ul");
        suggestions.className = "autocomplete-suggestions";
        suggestions.setAttribute("aria-label", "Adress-Vorschläge");

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "icon-button stop-remove-btn";
        removeButton.setAttribute("aria-label", "Lieferort entfernen");
        removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
        removeButton.addEventListener("click", function () {
            row.remove();
            renumberStopRows();
            updateAddStopButton();
        });

        const error = document.createElement("small");
        error.className = "field-error";

        wrapper.append(input, suggestions);
        line.append(wrapper, removeButton);
        row.append(label, line, error);
        elements.stopsList.appendChild(row);

        attachAutocomplete(input, suggestions);
        renumberStopRows();
        updateAddStopButton();

        return input;
    }

    function getStopRows() {
        return Array.from(elements.stopsList.querySelectorAll(".stop-row"));
    }

    function getStopInputs() {
        return Array.from(elements.stopsList.querySelectorAll(".stop-input"));
    }

    function getFilledStopInputs() {
        return getStopInputs().filter(function (input) {
            return input.value.trim().length > 0;
        });
    }

    function renumberStopRows() {
        const rows = getStopRows();

        rows.forEach(function (row, index) {
            const label = row.querySelector(".stop-label");
            const removeButton = row.querySelector(".stop-remove-btn");
            label.textContent = rows.length > 1 ? `Lieferort ${index + 1}` : "Lieferort";
            removeButton.hidden = rows.length === 1;
        });
    }

    function updateAddStopButton() {
        const count = getStopRows().length;
        elements.addStopButton.hidden = count >= MAX_STOPS;
        const labelSpan = elements.addStopButton.querySelector("span");
        labelSpan.textContent = count > 1
            ? `Lieferort hinzufügen (${count} von ${MAX_STOPS})`
            : "Lieferort hinzufügen";
    }

    function resetStopRows() {
        elements.stopsList.innerHTML = "";
        state.stopCounter = 0;
        addStopRow();
    }

    // ----- Dialog & Wizard -----

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
            const isDone = index < safeStep;
            const numberBadge = button.querySelector("span");

            button.classList.toggle("is-active", isActive);
            button.classList.toggle("is-done", isDone);
            button.setAttribute("aria-current", isActive ? "step" : "false");
            numberBadge.textContent = isDone ? "✓" : numberBadge.dataset.stepNumber;
        });

        elements.wizardBackButton.disabled = safeStep === 0;
        elements.wizardNextButton.hidden = safeStep === maxStep;
        elements.calculateButton.hidden = safeStep !== maxStep;
    }

    function validateStep(stepIndex) {
        clearErrors();

        if (stepIndex === 0) {
            let valid = true;

            if (!elements.startInput.value.trim()) {
                showFieldErrorFor(elements.startInput, "Bitte eine Start-Adresse eingeben.");
                valid = false;
            }

            const filledStops = getFilledStopInputs();

            if (!filledStops.length) {
                const firstStopInput = getStopInputs()[0];
                if (firstStopInput) {
                    showFieldErrorFor(firstStopInput, "Bitte mindestens einen Lieferort eingeben.");
                }
                valid = false;
            }

            return valid;
        }

        if (stepIndex === 1) {
            if (!getPackageData().isValid) {
                showRouteError("Bitte gültige Paketmaße, Gewicht und Anzahl eingeben.");
                return false;
            }
            return true;
        }

        if (stepIndex === 2) {
            const dieselPrice = getDieselPrice();
            if (!Number.isFinite(dieselPrice) || dieselPrice <= 0) {
                showRouteError("Bitte einen gültigen Dieselpreis eingeben.");
                return false;
            }
            return true;
        }

        return true;
    }

    // ----- CSV-Daten (lesen) -----

    async function loadCsvData() {
        setCsvStatus("Datenquelle wird geladen.");

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
            setCsvStatus("Live-Modus: CSV-Dateien verbunden. Fahrten werden zusätzlich in Fahrtenverlauf.csv geschrieben.");
        } catch (apiError) {
            try {
                const data = await loadStaticCsvData();
                applyCsvData(data, false);
                setCsvStatus("Demo-Modus: CSV-Daten geladen. Fahrten werden im Browser gespeichert und sind als CSV exportierbar.");
            } catch (staticError) {
                state.csvWriteEnabled = false;
                setCsvStatus("Demo-Modus: Eingebaute Beispieldaten aktiv. Fahrten werden im Browser gespeichert.");
            }
        }
    }

    async function loadStaticCsvData() {
        const [fahrer, fahrzeuge, pakete] = await Promise.all([
            fetchCsvRows("CSV/Fahrer.csv"),
            fetchCsvRows("CSV/Fahrzeug.csv"),
            fetchCsvRows("CSV/Paket.csv")
        ]);

        return {
            fahrer,
            fahrzeuge,
            pakete
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
            renderTruckOptions(getSelectedTruckValue());
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
            insurancePerDay: Number.isFinite(insurancePerDay)
                ? insurancePerDay
                : (baseVehicle ? baseVehicle.insurancePerDay : 0),
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
            insurancePerDay: 24,
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

    // ----- Formular-Optionen -----

    function renderTruckOptions(selectedValue) {
        const preferredValue = selectedValue || "auto";
        elements.truckOptions.innerHTML = "";

        appendTruckOption({
            value: "auto",
            name: "Automatische Empfehlung",
            meta: "Die Logik wählt das kleinste passende Fahrzeug",
            highlight: true,
            checked: preferredValue === "auto" || !VEHICLES.some(function (vehicle) {
                return vehicle.id === preferredValue;
            })
        });

        VEHICLES.forEach(function (truck) {
            appendTruckOption({
                value: truck.id,
                name: truck.name,
                meta: `${formatNumber(truck.payloadKg, 0)} kg · ${formatNumber(truck.volumeM3, 1)} m³ · ${formatNumber(truck.consumption, 1)} l / 100 km`,
                highlight: false,
                checked: truck.id === preferredValue
            });
        });
    }

    function appendTruckOption(option) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const content = document.createElement("span");
        const name = document.createElement("span");
        const meta = document.createElement("span");

        label.className = option.highlight ? "truck-option truck-option-auto" : "truck-option";
        input.type = "radio";
        input.name = "truck";
        input.value = option.value;
        input.checked = option.checked;
        input.defaultChecked = option.checked;
        content.className = "truck-option-content";
        name.className = "truck-option-name";
        meta.className = "truck-option-meta";
        name.textContent = option.name;
        meta.textContent = option.meta;
        content.append(name, meta);
        label.append(input, content);
        elements.truckOptions.appendChild(label);
    }

    function renderDriverOptions() {
        elements.driverSelect.innerHTML = "";

        state.drivers.forEach(function (driver, index) {
            const option = document.createElement("option");
            option.value = driver.id;
            option.textContent = `${driver.name} · ${formatCurrency(driver.hourlyRate)} / h`;
            option.selected = index === 0;
            option.defaultSelected = index === 0;
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
            option.defaultSelected = index === 0;
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

    // ----- Autocomplete -----

    function attachAutocomplete(input, suggestionsElement) {
        input.addEventListener("input", function () {
            resolvedAddresses.delete(input);
            handleAutocomplete(input, suggestionsElement);
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                clearSuggestions(suggestionsElement);
            }
        });
    }

    function handleAutocomplete(input, suggestionsElement) {
        const normalizedQuery = input.value.trim();

        clearTimeout(autocompleteTimers.get(input));

        const activeRequest = suggestionRequests.get(input);
        if (activeRequest) {
            activeRequest.abort();
            suggestionRequests.delete(input);
        }

        if (normalizedQuery.length < 3) {
            clearSuggestions(suggestionsElement);
            return;
        }

        autocompleteTimers.set(input, setTimeout(async function () {
            const controller = new AbortController();
            suggestionRequests.set(input, controller);

            try {
                const suggestions = await fetchAddressSuggestions(normalizedQuery, controller.signal);
                renderSuggestions(suggestions, input, suggestionsElement);
            } catch (error) {
                if (error.name !== "AbortError") {
                    clearSuggestions(suggestionsElement);
                }
            } finally {
                if (suggestionRequests.get(input) === controller) {
                    suggestionRequests.delete(input);
                }
            }
        }, 450));
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

    function renderSuggestions(suggestions, input, suggestionsElement) {
        clearSuggestions(suggestionsElement);

        if (!suggestions.length) {
            return;
        }

        suggestions.forEach(function (suggestion) {
            const item = document.createElement("li");
            item.tabIndex = 0;
            item.textContent = suggestion.label;
            item.addEventListener("click", function () {
                selectSuggestion(suggestion, input, suggestionsElement);
            });
            item.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    selectSuggestion(suggestion, input, suggestionsElement);
                }
            });
            suggestionsElement.appendChild(item);
        });

        suggestionsElement.classList.add("active");
    }

    function selectSuggestion(suggestion, input, suggestionsElement) {
        input.value = suggestion.label;
        resolvedAddresses.set(input, {
            lat: suggestion.lat,
            lng: suggestion.lng,
            label: suggestion.label
        });
        clearSuggestions(suggestionsElement);
        clearFieldErrorFor(input);
    }

    async function resolveInputAddress(input) {
        const address = input.value.trim();
        const cached = resolvedAddresses.get(input);

        if (cached && cached.label === address) {
            return cached;
        }

        const suggestions = await fetchAddressSuggestions(address);

        if (!suggestions.length) {
            return null;
        }

        const resolved = {
            lat: suggestions[0].lat,
            lng: suggestions[0].lng,
            label: suggestions[0].label
        };
        resolvedAddresses.set(input, resolved);
        return resolved;
    }

    // ----- Routenberechnung mit Nearest-Neighbor-Heuristik -----

    async function calculateRoute() {
        if (!state.map) {
            showRouteError("Die Karte ist noch nicht bereit.");
            return;
        }

        const firstInvalidStep = [0, 1, 2].find(function (step) {
            return !validateStep(step);
        });

        if (firstInvalidStep !== undefined) {
            setWizardStep(firstInvalidStep);
            return;
        }

        setBusy(true);

        try {
            const start = await resolveInputAddress(elements.startInput);

            if (!start) {
                setWizardStep(0);
                showFieldErrorFor(elements.startInput, `Start-Adresse nicht gefunden: "${elements.startInput.value.trim()}"`);
                return;
            }

            const stopInputs = getFilledStopInputs();
            const stops = [];

            for (const input of stopInputs) {
                const resolved = await resolveInputAddress(input);

                if (!resolved) {
                    setWizardStep(0);
                    showFieldErrorFor(input, `Adresse nicht gefunden: "${input.value.trim()}"`);
                    return;
                }

                stops.push(resolved);
            }

            const orderedStops = orderStopsNearestNeighbor(start, stops);
            const heuristic = buildHeuristicSummary(start, stops, orderedStops);

            state.currentRoute = {
                start,
                orderedStops,
                heuristic
            };

            await drawRoute(start, orderedStops);
            closeRouteDialog();
        } catch (error) {
            showRouteError("Die Route konnte nicht berechnet werden. Bitte versuche es erneut.");
        } finally {
            setBusy(false);
        }
    }

    // Kern der KI-Heuristik: Nearest Neighbor.
    // Vom aktuellen Standort aus wird immer der nächstgelegene, noch nicht
    // besuchte Lieferort gewählt (Luftlinie). Einfach erklärbar und in der
    // Praxis eine gute Näherung an die kürzeste Rundtour.
    function orderStopsNearestNeighbor(start, stops) {
        const remaining = stops.slice();
        const ordered = [];
        let current = start;

        while (remaining.length) {
            let nearestIndex = 0;

            for (let index = 1; index < remaining.length; index += 1) {
                if (calculateDistance(current, remaining[index]) < calculateDistance(current, remaining[nearestIndex])) {
                    nearestIndex = index;
                }
            }

            current = remaining.splice(nearestIndex, 1)[0];
            ordered.push(current);
        }

        return ordered;
    }

    function buildHeuristicSummary(start, inputOrder, optimizedOrder) {
        const inputDistanceKm = pathDistanceKm(start, inputOrder);
        const optimizedDistanceKm = pathDistanceKm(start, optimizedOrder);
        const savedKm = Math.max(0, inputDistanceKm - optimizedDistanceKm);
        const orderChanged = inputOrder.some(function (stop, index) {
            return optimizedOrder[index] !== stop;
        });

        return {
            stopCount: inputOrder.length,
            inputDistanceKm,
            optimizedDistanceKm,
            savedKm,
            savedPercent: inputDistanceKm > 0 ? savedKm / inputDistanceKm * 100 : 0,
            orderChanged
        };
    }

    function pathDistanceKm(start, stops) {
        let total = 0;
        let current = start;

        stops.forEach(function (stop) {
            total += calculateDistance(current, stop);
            current = stop;
        });

        return total;
    }

    function buildHeuristicSentence(heuristic) {
        if (!heuristic || heuristic.stopCount <= 1) {
            return "Direktfahrt zu einem Lieferort.";
        }

        if (heuristic.orderChanged && heuristic.savedKm > 0.05) {
            return `KI-Heuristik (Nearest Neighbor): Reihenfolge der ${heuristic.stopCount} Lieferorte optimiert – spart ca. ${formatNumber(heuristic.savedKm, 1)} km Luftlinie (${formatNumber(heuristic.savedPercent, 0)} %).`;
        }

        return `KI-Heuristik (Nearest Neighbor): Die eingegebene Reihenfolge der ${heuristic.stopCount} Lieferorte ist bereits optimal.`;
    }

    async function drawRoute(start, stops) {
        removeRouteLayers();
        showPendingResults();
        hideMapEmptyState();

        state.markers = [createStartMarker(start).addTo(state.map).bindPopup("Start")];
        stops.forEach(function (stop, index) {
            const marker = createStopMarker(stop, index + 1, index === stops.length - 1);
            marker.addTo(state.map).bindPopup(`Stopp ${index + 1}: ${formatCompactAddressLabel(stop.label)}`);
            state.markers.push(marker);
        });

        try {
            const route = await fetchRouteGeometry(start, stops);
            drawRouteLine(route.coordinates, false);
            fitRouteBounds(route.coordinates);
            renderRouteMetrics(route.distance, route.duration, "Sichtbare Straßenroute");
        } catch (error) {
            const fallbackCoordinates = [start, ...stops].map(function (point) {
                return [point.lat, point.lng];
            });

            drawRouteLine(fallbackCoordinates, true);
            fitRouteBounds(fallbackCoordinates);
            renderFallbackMetrics(start, stops);
            showRouteError("OSRM konnte keine Straßenroute liefern. Angezeigt wird die Luftlinien-Entfernung.");
        }
    }

    async function fetchRouteGeometry(start, stops) {
        const waypoints = [start, ...stops].map(function (point) {
            return `${point.lng},${point.lat}`;
        }).join(";");

        const url = new URL(`${ROUTING_SERVICE_URL}/driving/${waypoints}`);
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
        state.map.invalidateSize();
        state.map.fitBounds(bounds, {
            animate: true,
            padding: [42, 42]
        });
    }

    function createStartMarker(location) {
        const icon = L.divIcon({
            className: "",
            html: `
                <span class="route-marker" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                </span>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18]
        });

        return L.marker([location.lat, location.lng], { icon });
    }

    function createStopMarker(location, number, isLast) {
        const icon = L.divIcon({
            className: "",
            html: `
                <span class="route-marker route-marker-stop ${isLast ? "route-marker-end" : ""}" aria-hidden="true">${number}</span>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18]
        });

        return L.marker([location.lat, location.lng], { icon });
    }

    // ----- Ergebnisse -----

    function setResultsVisible(visible) {
        elements.resultsHero.hidden = !visible;
        elements.resultsSide.hidden = !visible;
        elements.resultsDetails.hidden = !visible;
        elements.mapRow.classList.toggle("has-results", visible);

        if (elements.overviewWindows) {
            elements.overviewWindows.hidden = visible;
        }

        if (state.map) {
            window.requestAnimationFrame(function () {
                state.map.invalidateSize();
            });
        }
    }

    function renderRouteChain() {
        elements.routeChain.innerHTML = "";

        if (!state.currentRoute) {
            return;
        }

        const startItem = document.createElement("li");
        startItem.className = "chain-stop chain-start";
        startItem.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
        startItem.appendChild(document.createTextNode(formatCompactAddressLabel(state.currentRoute.start.label)));
        elements.routeChain.appendChild(startItem);

        state.currentRoute.orderedStops.forEach(function (stop, index) {
            const item = document.createElement("li");
            const number = document.createElement("span");

            item.className = index === state.currentRoute.orderedStops.length - 1
                ? "chain-stop chain-end"
                : "chain-stop";
            number.className = "chain-num";
            number.textContent = String(index + 1);
            item.append(number, document.createTextNode(formatCompactAddressLabel(stop.label)));
            elements.routeChain.appendChild(item);
        });
    }

    function renderHeuristicVisual(heuristic) {
        elements.heuristicVisual.innerHTML = "";

        if (!heuristic || heuristic.stopCount <= 1) {
            return;
        }

        const maxDistance = Math.max(heuristic.inputDistanceKm, heuristic.optimizedDistanceKm, 1);
        const rows = [
            ["Eingegebene Reihenfolge", heuristic.inputDistanceKm, false],
            ["KI-optimierte Reihenfolge", heuristic.optimizedDistanceKm, true]
        ];

        rows.forEach(function (rowData) {
            const row = document.createElement("div");
            const head = document.createElement("div");
            const label = document.createElement("span");
            const value = document.createElement("strong");
            const bar = document.createElement("div");
            const fill = document.createElement("span");

            row.className = "heuristic-bar-row";
            head.className = "heuristic-bar-head";
            bar.className = "heuristic-bar";
            fill.className = rowData[2] ? "heuristic-bar-fill is-optimized" : "heuristic-bar-fill";
            label.textContent = rowData[0];
            value.textContent = `${formatNumber(rowData[1], 1)} km`;
            fill.style.width = `${Math.max(4, Math.round(rowData[1] / maxDistance * 100))}%`;

            head.append(label, value);
            bar.appendChild(fill);
            row.append(head, bar);
            elements.heuristicVisual.appendChild(row);
        });

        const note = document.createElement("p");
        note.className = "heuristic-visual-note";
        note.textContent = "Vergleich der Luftlinien-Distanzen beider Reihenfolgen.";
        elements.heuristicVisual.appendChild(note);
    }

    function showPendingResults() {
        const packageData = getPackageData();
        const heuristic = getCurrentHeuristic();

        setResultsVisible(true);
        renderRouteChain();
        renderHeuristicVisual(heuristic);
        elements.heuristicBadgeText.textContent = buildHeuristicShortLabel(heuristic);
        elements.distance.textContent = "-";
        elements.distanceInfo.textContent = "Routingdaten werden geladen.";
        elements.duration.textContent = "Wird berechnet";
        elements.routeInfo.textContent = "";
        elements.resultTruck.textContent = "Wird geprüft";
        elements.resultTruckInfo.textContent = "Fahrzeugvorschlag wird nach Paket- und Routendaten berechnet.";
        elements.resultDriver.textContent = "-";
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

        elements.distance.textContent = distanceKm.toFixed(2);
        elements.distanceInfo.textContent = buildHeuristicSentence(getCurrentHeuristic());
        elements.duration.textContent = formatDuration(durationMinutes);
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
        recordTrip(costPlan);
        clearErrors();
    }

    function renderFallbackMetrics(start, stops) {
        const distanceKm = pathDistanceKm(start, stops);
        const estimatedDurationSeconds = distanceKm / 65 * 3600;
        const estimatedMinutes = Math.max(1, Math.round(estimatedDurationSeconds / 60));
        const costPlan = calculateCostPlan(distanceKm, estimatedDurationSeconds);

        state.currentResult = {
            distanceKm,
            durationSeconds: estimatedDurationSeconds,
            routeInfo: "Luftlinien-Entfernung, Fahrzeit mit 65 km/h geschätzt."
        };

        elements.distance.textContent = distanceKm.toFixed(2);
        elements.distanceInfo.textContent = buildHeuristicSentence(getCurrentHeuristic());
        elements.duration.textContent = `${formatDuration(estimatedMinutes)} (geschätzt)`;
        elements.routeInfo.textContent = `${state.currentResult.routeInfo} ${costPlan.priority.routeReason}`;
        renderCostPlan(costPlan);
        recordTrip(costPlan);
    }

    function getCurrentHeuristic() {
        return state.currentRoute ? state.currentRoute.heuristic : null;
    }

    // ----- Kostenplanung (BWL) -----

    function calculateCostPlan(distanceKm, durationSeconds) {
        const manualTruck = getSelectedTruck();
        const selectedDriver = getSelectedDriver();
        const priority = getSelectedPriority();
        const dieselPrice = getDieselPrice();
        const packageData = getPackageData();
        const recommendation = getVehicleRecommendation(priority, packageData);
        const plannedTruck = manualTruck || recommendation.truck;
        const durationHours = Math.max(durationSeconds / 3600, distanceKm / 70);
        const tripCost = calculateTripCost(plannedTruck, selectedDriver, distanceKm, durationHours, dieselPrice, priority.factor);

        let comparison = null;

        if (manualTruck && manualTruck.id !== recommendation.truck.id) {
            const recommendedCost = calculateTripCost(recommendation.truck, selectedDriver, distanceKm, durationHours, dieselPrice, priority.factor);
            comparison = {
                truck: recommendation.truck,
                totalCost: recommendedCost.totalCost,
                deltaEur: tripCost.totalCost - recommendedCost.totalCost
            };
        }

        const benefits = calculateBenefits(plannedTruck, selectedDriver, distanceKm, durationHours, dieselPrice, priority.factor, tripCost.totalCost);

        return {
            manualTruck,
            selectedDriver,
            plannedTruck,
            priority,
            dieselPrice,
            packageData,
            distanceKm,
            durationHours,
            consumedLiters: tripCost.consumedLiters,
            fuelCost: tripCost.fuelCost,
            totalCost: tripCost.totalCost,
            bwlCosts: tripCost.bwlCosts,
            benefits,
            recommendation,
            comparison
        };
    }

    function calculateTripCost(vehicle, driver, distanceKm, durationHours, dieselPrice, priorityFactor) {
        const consumedLiters = distanceKm / 100 * vehicle.consumption;
        const fuelCost = consumedLiters * dieselPrice * priorityFactor;
        const bwlCosts = calculateBwlCosts(vehicle, driver, durationHours);

        return {
            consumedLiters,
            fuelCost,
            bwlCosts,
            totalCost: fuelCost + bwlCosts.total
        };
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

    // Nutzen ehrlich hergeleitet: Ersparnis durch die Routen-Heuristik und
    // durch die Fahrzeugwahl im Vergleich zum größten Fahrzeug der Flotte.
    function calculateBenefits(plannedTruck, driver, distanceKm, durationHours, dieselPrice, priorityFactor, totalCost) {
        const heuristic = getCurrentHeuristic();
        const savedKm = heuristic ? heuristic.savedKm : 0;
        const costPerKm = distanceKm > 0 ? totalCost / distanceKm : 0;
        const routeSavingEur = savedKm * costPerKm;
        const timeSavedMinutes = savedKm / 65 * 60;

        const largestTruck = VEHICLES.reduce(function (largest, vehicle) {
            return vehicle.volumeM3 > largest.volumeM3 ? vehicle : largest;
        }, VEHICLES[0]);

        let vehicleSavingEur = 0;

        if (largestTruck.id !== plannedTruck.id) {
            const largestCost = calculateTripCost(largestTruck, driver, distanceKm, durationHours, dieselPrice, priorityFactor);
            vehicleSavingEur = Math.max(0, largestCost.totalCost - totalCost);
        }

        return {
            savedKm,
            routeSavingEur,
            timeSavedMinutes,
            vehicleSavingEur,
            largestTruckName: largestTruck.name
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
        elements.costInfo.textContent = `${formatCurrency(plan.fuelCost)} Kraftstoff + ${formatCurrency(plan.bwlCosts.total)} BWL-Anteile`;
        elements.resultDriver.textContent = plan.selectedDriver ? plan.selectedDriver.name : "-";
        elements.heuristicBadgeText.textContent = buildHeuristicShortLabel(getCurrentHeuristic());
        renderCostBreakdown(plan);
        renderBenefits(plan);
        elements.recommendationTitle.textContent = `Empfehlung: ${plan.recommendation.truck.name}`;
        elements.recommendationText.textContent = buildRecommendationText(plan);
    }

    function buildHeuristicShortLabel(heuristic) {
        if (!heuristic) {
            return "-";
        }

        if (heuristic.stopCount <= 1) {
            return "Direktfahrt";
        }

        if (heuristic.orderChanged && heuristic.savedKm > 0.05) {
            return `${heuristic.stopCount} Stopps · ${formatNumber(heuristic.savedKm, 1)} km gespart`;
        }

        return `${heuristic.stopCount} Stopps · Reihenfolge optimal`;
    }

    function buildRecommendationText(plan) {
        const baseText = `${plan.recommendation.reason} Für die BWL-Auswertung werden Anschaffung, Wartung, Schulung, Versicherung und Personal anteilig pro Fahrt berücksichtigt.`;

        if (!plan.manualTruck) {
            return `Automatische Auswahl aktiv: Die Planungslogik setzt ${plan.plannedTruck.name} ein. ${baseText} Der geschätzte Gesamtaufwand liegt bei ${formatCurrency(plan.totalCost)}.`;
        }

        if (!plan.comparison) {
            return `Deine Auswahl entspricht der Empfehlung der Planungslogik. ${baseText} Der geschätzte Gesamtaufwand liegt bei ${formatCurrency(plan.totalCost)}.`;
        }

        const deltaText = plan.comparison.deltaEur > 0.005
            ? `Mit der Empfehlung ${plan.comparison.truck.name} (${formatCurrency(plan.comparison.totalCost)}) würdest du ${formatCurrency(plan.comparison.deltaEur)} sparen.`
            : `Deine Auswahl ist sogar ${formatCurrency(Math.abs(plan.comparison.deltaEur))} günstiger als die Empfehlung ${plan.comparison.truck.name}.`;

        return `Ausgewählt ist ${plan.plannedTruck.name} mit ${formatCurrency(plan.totalCost)} Gesamtaufwand. ${deltaText} ${baseText}`;
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

    function renderCostBreakdown(plan) {
        elements.bwlCosts.innerHTML = "";

        const items = [
            ["Kraftstoff", plan.fuelCost],
            ["Personalkosten", plan.bwlCosts.personnelCost],
            ["Anschaffungskosten", plan.bwlCosts.acquisitionShare],
            ["Wartungskosten", plan.bwlCosts.maintenanceShare],
            ["Versicherungskosten", plan.bwlCosts.insuranceShare],
            ["Schulungskosten", plan.bwlCosts.trainingShare]
        ].sort(function (a, b) {
            return b[1] - a[1];
        });

        const maxValue = Math.max(items[0][1], 0.01);

        items.forEach(function (item) {
            const row = document.createElement("li");
            const head = document.createElement("div");
            const label = document.createElement("span");
            const value = document.createElement("strong");
            const bar = document.createElement("div");
            const fill = document.createElement("span");

            head.className = "breakdown-head";
            bar.className = "breakdown-bar";
            fill.className = "breakdown-bar-fill";
            label.textContent = item[0];
            value.textContent = formatCurrency(item[1]);
            fill.style.width = `${Math.max(2, Math.round(item[1] / maxValue * 100))}%`;

            head.append(label, value);
            bar.appendChild(fill);
            row.append(head, bar);
            elements.bwlCosts.appendChild(row);
        });
    }

    function renderBenefits(plan) {
        elements.bwlBenefits.innerHTML = "";

        const benefits = plan.benefits;

        [
            [
                "Routenoptimierung",
                benefits.savedKm > 0.05
                    ? `${formatNumber(benefits.savedKm, 1)} km · ${formatCurrency(benefits.routeSavingEur)} gespart`
                    : "Reihenfolge bereits optimal"
            ],
            [
                "Zeitersparnis",
                benefits.timeSavedMinutes >= 1
                    ? `ca. ${formatNumber(benefits.timeSavedMinutes, 0)} min kürzere Tour`
                    : "–"
            ],
            [
                "Fahrzeugwahl",
                benefits.vehicleSavingEur > 0.5
                    ? `${formatCurrency(benefits.vehicleSavingEur)} günstiger als ${benefits.largestTruckName}`
                    : "Größtes Fahrzeug erforderlich"
            ],
            ["Fehlerreduktion", "Gewicht, Volumen und Maße automatisch geprüft"]
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

    // ----- Fahrtenverlauf (Browser-Speicher + CSV-Export) -----

    function loadTripsFromStorage() {
        try {
            const raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            state.trips = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            state.trips = [];
        }
    }

    function persistTrips() {
        try {
            window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(state.trips));
        } catch (error) {
            // Speicher voll oder blockiert: Verlauf bleibt nur für die Sitzung erhalten.
        }
    }

    function recordTrip(plan) {
        if (!state.currentRoute) {
            return;
        }

        const now = new Date();
        const trip = {
            id: `F-${formatDateStamp(now)}-${formatTimeStamp(now)}`,
            datum: formatIsoDate(now),
            fahrzeugId: plan.plannedTruck.id,
            fahrzeugName: plan.plannedTruck.name,
            fahrerId: plan.selectedDriver ? plan.selectedDriver.id : "",
            fahrerName: plan.selectedDriver ? plan.selectedDriver.name : "-",
            startort: state.currentRoute.start.label,
            zielorte: state.currentRoute.orderedStops.map(function (stop) {
                return stop.label;
            }),
            kosten: plan.totalCost
        };

        state.trips.unshift(trip);

        if (state.trips.length > 200) {
            state.trips.length = 200;
        }

        persistTrips();
        renderTripLog();

        if (state.csvWriteEnabled) {
            sendTripToServer(trip);
        } else {
            setCsvStatus("Fahrt im Browser-Verlauf gespeichert. CSV-Download unten auf der Seite.");
        }
    }

    async function sendTripToServer(trip) {
        try {
            const response = await fetch("api/fahrten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fahrtId: trip.id,
                    datum: trip.datum,
                    fahrzeugId: trip.fahrzeugId,
                    fahrerId: trip.fahrerId,
                    startort: trip.startort,
                    zielort: trip.zielorte.join(" | "),
                    kostenGesamtEur: formatNumber(trip.kosten, 2)
                })
            });

            if (!response.ok) {
                throw new Error("Fahrt konnte nicht gespeichert werden.");
            }

            setCsvStatus("Fahrt gespeichert: im Browser-Verlauf und in CSV/Fahrtenverlauf.csv.");
        } catch (error) {
            setCsvStatus("Fahrt im Browser-Verlauf gespeichert. Die CSV-Datei war nicht erreichbar.");
        }
    }

    function renderTripLog() {
        const count = state.trips.length;

        elements.tripCount.textContent = count === 1 ? "1 Fahrt" : `${count} Fahrten`;
        elements.tripDownloadButton.disabled = !count;
        elements.tripClearButton.disabled = !count;
        elements.tripLogBody.innerHTML = "";

        if (!count) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.className = "trip-empty";
            cell.textContent = "Noch keine Fahrten gespeichert. Berechne eine Route, um den Verlauf zu füllen.";
            row.appendChild(cell);
            elements.tripLogBody.appendChild(row);
            return;
        }

        state.trips.forEach(function (trip) {
            const row = document.createElement("tr");
            const routeLabel = [trip.startort].concat(trip.zielorte || []).map(function (label) {
                return formatCompactAddressLabel(label);
            }).join(" → ");

            [
                trip.datum,
                routeLabel,
                trip.fahrzeugName || trip.fahrzeugId,
                trip.fahrerName || "-",
                formatCurrency(trip.kosten)
            ].forEach(function (value, index) {
                const cell = document.createElement("td");
                cell.textContent = value;
                if (index === 4) {
                    cell.className = "align-right trip-cost";
                }
                row.appendChild(cell);
            });

            elements.tripLogBody.appendChild(row);
        });
    }

    function downloadTripsCsv() {
        if (!state.trips.length) {
            return;
        }

        const lines = [TRIP_CSV_HEADERS.join(";")];

        state.trips.slice().reverse().forEach(function (trip) {
            lines.push([
                trip.id,
                trip.datum,
                trip.fahrzeugId,
                trip.fahrerId,
                escapeCsvValue(trip.startort),
                escapeCsvValue((trip.zielorte || []).join(" | ")),
                formatNumber(trip.kosten, 2)
            ].join(";"));
        });

        const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
            type: "text/csv;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Fahrtenverlauf.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function escapeCsvValue(value) {
        const text = String(value == null ? "" : value);
        return /[";\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    }

    function clearTripLog() {
        if (!state.trips.length) {
            return;
        }

        if (!window.confirm("Fahrtenverlauf im Browser wirklich löschen?")) {
            return;
        }

        state.trips = [];
        persistTrips();
        renderTripLog();
        setCsvStatus("Fahrtenverlauf im Browser wurde geleert.");
    }

    function formatDateStamp(date) {
        return `${date.getFullYear()}${padTwo(date.getMonth() + 1)}${padTwo(date.getDate())}`;
    }

    function formatTimeStamp(date) {
        return `${padTwo(date.getHours())}${padTwo(date.getMinutes())}${padTwo(date.getSeconds())}`;
    }

    function formatIsoDate(date) {
        return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
    }

    function padTwo(value) {
        return String(value).padStart(2, "0");
    }

    // ----- Hilfsfunktionen -----

    function formatCompactAddressLabel(value) {
        const trimmedValue = String(value || "").trim();

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
        resetStopRows();
        resolvedAddresses.delete(elements.startInput);

        setResultsVisible(false);
        elements.routeChain.innerHTML = "";
        elements.heuristicVisual.innerHTML = "";
        elements.heuristicBadgeText.textContent = "-";
        elements.distance.textContent = "-";
        elements.distanceInfo.textContent = "";
        elements.duration.textContent = "-";
        elements.routeInfo.textContent = "";
        elements.resultTruck.textContent = "-";
        elements.resultTruckInfo.textContent = "";
        elements.resultDriver.textContent = "-";
        elements.resultPackage.textContent = "-";
        elements.resultLoad.textContent = "";
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
        showMapEmptyState();

        state.currentRoute = null;
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

    function showMapEmptyState() {
        if (elements.mapEmptyState) {
            elements.mapEmptyState.hidden = false;
        }
    }

    function hideMapEmptyState() {
        if (elements.mapEmptyState) {
            elements.mapEmptyState.hidden = true;
        }
    }

    function setBusy(isBusy) {
        elements.calculateButton.disabled = isBusy;
        elements.calculateButton.querySelector("span").textContent = isBusy ? "Berechne Route" : "Route berechnen";
    }

    function getSelectedTruckValue() {
        const field = elements.form.elements.truck;
        return field && field.value ? field.value : "auto";
    }

    function getSelectedTruck() {
        const selectedValue = getSelectedTruckValue();

        if (selectedValue === "auto") {
            return null;
        }

        return VEHICLES.find(function (truck) {
            return truck.id === selectedValue;
        }) || null;
    }

    function getSelectedDriver() {
        const selectedDriverId = elements.driverSelect.value;
        return state.drivers.find(function (driver) {
            return driver.id === selectedDriverId;
        }) || state.drivers[0] || null;
    }

    function getSelectedPriority() {
        const field = elements.form.elements.priority;
        return PRIORITIES[field ? field.value : ""] || PRIORITIES.effizient;
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

        if (!truck) {
            elements.selectedTruckName.textContent = "Automatische Empfehlung";
            elements.selectedTruckDetails.textContent = "Die Planungslogik wählt das kleinste passende Fahrzeug für Paket und Priorität.";
            return;
        }

        elements.selectedTruckName.textContent = truck.name;
        elements.selectedTruckDetails.textContent = `${formatNumber(truck.consumption, 1)} l / 100 km · ${formatNumber(truck.payloadKg, 0)} kg Nutzlast · ${formatNumber(truck.volumeM3, 1)} m³ Laderaum`;
    }

    function showFieldErrorFor(input, message) {
        const group = input.closest(".form-group");
        const errorElement = group ? group.querySelector(".field-error") : null;

        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearFieldErrorFor(input) {
        const group = input.closest(".form-group");
        const errorElement = group ? group.querySelector(".field-error") : null;

        if (errorElement) {
            errorElement.textContent = "";
        }
    }

    function showRouteError(message) {
        elements.routeError.textContent = message;
    }

    function clearErrors() {
        elements.form.querySelectorAll(".field-error").forEach(function (errorElement) {
            errorElement.textContent = "";
        });
        elements.routeError.textContent = "";
    }

    function closeSuggestions() {
        document.querySelectorAll(".autocomplete-suggestions").forEach(function (suggestionsElement) {
            clearSuggestions(suggestionsElement);
        });
    }

    function clearSuggestions(suggestionsElement) {
        suggestionsElement.innerHTML = "";
        suggestionsElement.classList.remove("active");
    }
})();
