/**
 * TikaEditor - Main class for managing the technical itinerary editor
 * Handles initialization, state management, and orchestration of the editor components
 */
class TikaEditor {
    constructor() {
        this.DEFAULT_TITLE = "Nouvel itinéraire technique";
        
        // Initialize the crops data structure
        this.system = {
            "title": this.DEFAULT_TITLE,
            "options": {
                "view": "horizontal",
                "show_transcript": true,
                "title_top_interventions": "Contrôle adventices",
                "title_bottom_interventions": "Autres interventions",
                "title_steps": "Étapes de la rotation dans la parcelle",
                "region": "France"
            },
            "steps": []
        };

        this.selectedStep = null; // Current step being edited
        this.editorLoader = null; // WikiLoader or ItineraLoader instance
        this.InterventionTableManager = new InterventionTable(
            this.system.options.title_top_interventions,
            this.system.options.title_bottom_interventions,
            this
        );
    }

    /**
     * Initialize the editor on page load
     */
    initialize() {
        this.initializeOptions();
        this.setupEventListeners();
        this.setupDomReady();
    }

    /**
     * Initialize editor options and UI components
     */
    initializeOptions() {
        document.getElementById("title").textContent = this.system.title;

        this.attachCropInputListeners();
        this.enableTitleEditing();
        this.setupCloseStepButtons();
        this.setupCropFormKeydown();
        this.setupCropsSortable();
        this.setupParamsModal();
    }

    /**
     * Setup close step buttons event handlers
     */
    setupCloseStepButtons() {
        const self = this;
        $('.close-step-button').click(function() {
            // Set the current step to be fully edited now:
            self.selectedStep.setAsEdited();
            self.hideStepEditor();
        });
    }

    /**
     * Setup form keydown prevention
     */
    setupCropFormKeydown() {
        $(function() {
            $('#cropForm').on('keydown', function(e) {
                // Prevent form submit on Enter, but allow Enter in textarea
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    return false;
                }
            });
        });
    }

    /**
     * Make crops container sortable with drag and drop
     */
    setupCropsSortable() {
        const self = this;
        $("#cropsContainer").sortable({
            handle: '.drag-handle',
            axis: 'y',
            update: function (event, ui) {
                // Set new order
                let movedStepId = ui.item.data('id');
                let lastStepEnd = null;

                let newOrder = [];
                $(event.target).children('.step-row').each(function () {
                    let id = $(this).data('id');
                    let step = self.system.steps.find(function (crop) { return crop.id == id });

                    if (movedStepId == id) {
                        let movedStep = new StepModel(step);
                        let duration = movedStep.getDurationInDays();

                        if (lastStepEnd != null) { 
                            lastStepEnd.setDate(lastStepEnd.getDate() + 1);

                            movedStep.setStartDate(lastStepEnd);
                            movedStep.setDurationInDays(duration);
                        } else {
                            // This is the first step in the list, set its start date before the previously first step start date
                            let nextStep = self.system.steps[0];
                            let newStartDate = new Date(nextStep.startDate.valueOf());
                            newStartDate.setDate(newStartDate.getDate() - duration);
                            movedStep.setStartDate(newStartDate);
                            movedStep.setDurationInDays(duration);
                        }

                        step = movedStep.getStep();
                    }
                    else {
                        lastStepEnd = new Date(step.endDate.valueOf());
                    }

                    newOrder.push(step);
                });

                self.system.steps = newOrder;
                self.refreshAllTables();
            }
        });
    }

    /**
     * Setup parameters modal event handlers
     */
    setupParamsModal() {
        const self = this;
        
        $('#modalParams').on('show.bs.modal', function (event) {
            // Set the modal form inputs values from crops.options
            $("#viewSelect").val(self.system.options.view);
            $("#showTranscriptCheckbox").prop("checked", self.system.options.show_transcript);
            $("#topInterventionsTitle").val(self.system.options.title_top_interventions);
            $("#bottomInterventionsTitle").val(self.system.options.title_bottom_interventions);
            $("#stepsTitle").val(self.system.options.title_steps);
            $("#regionInput").val(self.system.options.region ?? "France");
            $("#addressInput").val(self.system.options.address ?? "");
            $("#latitudeInput").val(self.system.options.latitude ?? "");
            $("#longitudeInput").val(self.system.options.longitude ?? "");
            
            // Load ombrothermic data from climate_data if present
            let hasClimateData = self.system.options.climate_data && 
                                 self.system.options.climate_data.temperatures && 
                                 self.system.options.climate_data.precipitations;
            
            // Check the checkbox if show_climate_diagram is explicitly true OR if climate_data exists
            let showDiagram = self.system.options.show_climate_diagram === true;
            $("#ombroCheck").prop("checked", showDiagram);
            
            if (hasClimateData) {
                let tempLine = self.system.options.climate_data.temperatures.join(' ');
                let precipLine = self.system.options.climate_data.precipitations.join(' ');
                $("#ombroData").val(tempLine + '\n' + precipLine);
            } else {
                $("#ombroData").val("");
            }
            
            // Enable/disable textarea based on checkbox state
            $("#ombroData").prop("disabled", !showDiagram);
        });
        
        // Add event listener to toggle textarea when checkbox changes
        $("#ombroCheck").on("change", function() {
            $("#ombroData").prop("disabled", !this.checked);
        });
        
        // Update Google Maps link when coordinates change
        function updateGoogleMapsLink() {
            const lat = $("#latitudeInput").val().trim();
            const lon = $("#longitudeInput").val().trim();
            
            if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                $("#googleMapsLink a").attr("href", mapsUrl);
                $("#googleMapsLink").show();
            } else {
                $("#googleMapsLink").hide();
            }
        }
        
        // Attach listeners to lat/long inputs
        $("#latitudeInput, #longitudeInput").on("input change", updateGoogleMapsLink);
        
        // Update link when modal opens
        $('#modalParams').on('shown.bs.modal', function() {
            updateGoogleMapsLink();
        });
        
        // Location search button handler
        $("#searchLocationBtn").on("click", function() {
            const address = $("#addressInput").val().trim();
            
            if (!address) {
                $("#locationSearchStatus").html('<span class="text-warning">Veuillez entrer une adresse</span>');
                return;
            }
            
            // Show loading state
            $("#searchLocationBtn").prop("disabled", true);
            $("#locationSearchStatus").html('<i class="fa fa-spinner fa-spin"></i> Recherche en cours...');
            
            $.ajax({
                url: "https://itk-info.tripleperformance.fr/api/location",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ address: address }),
                success: function(data) {
                    console.log("Location data received:", data);
                    
                    // Populate latitude and longitude
                    if (data.latitude && data.longitude) {
                        $("#latitudeInput").val(data.latitude);
                        $("#longitudeInput").val(data.longitude);
                        updateGoogleMapsLink();
                    }
                    
                    // Populate climate data if available
                    if (data.monthly_temperatures && data.monthly_rainfall) {
                        let tempLine = data.monthly_temperatures.join(' ');
                        let precipLine = data.monthly_rainfall.join(' ');
                        $("#ombroData").val(tempLine + '\n' + precipLine);
                        $("#ombroCheck").prop("checked", true);
                        $("#ombroData").prop("disabled", false);
                    }
                    
                    // Show success message
                    let message = '<span class="text-success">✓ Coordonnées trouvées';
                    if (data.source_explanation) {
                        message += ' — ' + data.source_explanation;
                    }
                    message += '</span>';
                    $("#locationSearchStatus").html(message);
                },
                error: function(err) {
                    console.error("Location search error:", err);
                    $("#locationSearchStatus").html('<span class="text-danger">Erreur lors de la recherche</span>');
                },
                complete: function() {
                    $("#searchLocationBtn").prop("disabled", false);
                }
            });
        });

        $("#paramsModalSaveButton").click(function () {
            self.system.options.view = $("#viewSelect").val();
            self.system.options.show_transcript = $("#showTranscriptCheckbox").prop("checked");
            self.system.options.title_top_interventions = $("#topInterventionsTitle").val();
            self.system.options.title_bottom_interventions = $("#bottomInterventionsTitle").val();
            self.system.options.title_steps = $("#stepsTitle").val();
            self.system.options.region = $("#regionInput").val();
            self.system.options.address = $("#addressInput").val().trim();
            self.system.options.latitude = $("#latitudeInput").val().trim();
            self.system.options.longitude = $("#longitudeInput").val().trim();
            
            // Convert ombrothermic data to climate_data object
            let ombroEnabled = $("#ombroCheck").prop("checked");
            
            if (ombroEnabled) {
                self.system.options.show_climate_diagram = true;
                
                let ombroText = $("#ombroData").val().trim();
                let lines = ombroText.split('\n');
                
                if (lines.length >= 2) {
                    let temperatures = lines[0].trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
                    let precipitations = lines[1].trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
                    
                    if (temperatures.length > 0 && precipitations.length > 0) {
                        self.system.options.climate_data = {
                            temperatures: temperatures,
                            precipitations: precipitations
                        };
                    } else {
                        delete self.system.options.climate_data;
                    }
                } else {
                    delete self.system.options.climate_data;
                }
            } else {
                self.system.options.show_climate_diagram = false;
            }

            // Close the modal:
            let modal = bootstrap.Modal.getInstance(document.getElementById('modalParams'));
            modal.hide();

            self.refreshAllTables();
        });
    }

    /**
     * Setup event listeners (to be called after DOM is ready)
     */
    setupEventListeners() {
        // Will be populated when moving more code
    }

    /**
     * Setup actions when DOM is ready
     */
    setupDomReady() {
        const self = this;
        $(document).ready(function() {
            // If we are in a wiki (the domain contains "tripleperformance.ag or tripleperformance.fr" then show the Wiki buttons
            if (window.location.hostname.includes("tripleperformance.ag") || window.location.hostname.includes("tripleperformance.fr")) {

                // Hide NonWikiButtons
                self.editorLoader = new WikiLoader(self);
                self.editorLoader.setupButtons();
                self.editorLoader.loadPageFromURL();

            } else if (window.location.hostname.includes("itinera.ag") || 
                      (window.location.hostname.includes("localhost") && window.location.search.includes("itinera")) ) {

                // If we are in Itinera - the domain is *.itinera.ag or localhost with a itinera param
                self.editorLoader = new ItineraLoader(self);
                self.editorLoader.setupButtons();
                self.editorLoader.loadPageFromURL();

            } else {

                self.editorLoader = new DefaultLoader(self); // Use DefaultLoader for NonWikiButtons mode
                self.editorLoader.setupButtons();
            }
        });
    }

    /**
     * Update color of the selected step
     */
    updateSelectedStepColor() {
        this.selectedStep.step.useDefaultColor = false;
        this.selectedStep.updateFromForm();
        this.refreshAllTables();
    }

    /**
     * Update start date of the selected step
     */
    updateSelectedStepStartDate() {
        this.selectedStep.step.useDefaultStartDate = false;
        this.selectedStep.updateFromForm();
        this.refreshAllTables();
    }

    /**
     * Update end date of the selected step
     */
    updateSelectedStepEndDate() {
        this.selectedStep.step.useDefaultEndDate = false;
        this.selectedStep.updateFromForm();
        this.refreshAllTables();
    }

    /**
     * Update the selected step from form values
     */
    updateSelectedStep() {
        this.selectedStep.updateFromForm();
        this.refreshAllTables();
    }

    /**
     * Set value to an input element
     */
    setInputValue(elementId, value) {
        document.getElementById(elementId).value = value;
    }

    /**
     * Refresh all tables and views
     */
    refreshAllTables() {
        this.refreshStepsButtonList();
        this.renderChart();
    }

    /**
     * Display crop detail view
     */
    showStepEditor() {
        $('#cropEditorView').show();
        $('#welcomeView').hide();
        $('#cropListView').hide();
    }

    /**
     * Display crop list view
     */
    hideStepEditor() {
        $('#cropListView').show();
        $('#welcomeView').hide();
        $('#cropEditorView').hide();        
    }

    /**
     * Render the chart
     */
    renderChart() {
        const self = this;
        let renderer = new RotationRenderer('itk', this.system);
        renderer.render();

        $('.step-edit').click(function (event) {
            event.stopPropagation();
            let stepId = renderer.getElementID(event.target.closest('.rotation_item'));
            
            let index = stepId.split('_')[1];
            self.selectedStep = new StepModel(self.system.steps[index]);
            self.selectStep(self.selectedStep);
        });
    }

    /**
     * Get the end date of the rotation (last step end date + 1 day)
     */
    getRotationEndDate() {
        let latestEndDate = null;
        this.system.steps.forEach(function (crop) {
            if (latestEndDate == null || crop.endDate > latestEndDate) {
                latestEndDate = crop.endDate;
            }
        });

        // Clone the date to avoid reference issues
        if (latestEndDate == null)
            latestEndDate = new Date();
        else {
            latestEndDate = new Date(latestEndDate.valueOf());

            // Move to the next day
            latestEndDate.setDate(latestEndDate.getDate() + 1);
        }

        return latestEndDate;
    }

    /**
     * Reload crops data from JSON
     */
    reloadCropsFromJson(cropsFromJson) {
        console.log("Données JSON importées :", cropsFromJson);

        this.system = cropsFromJson;

        this.initializeOptions();
        this.refreshAllTables();
        this.hideStepEditor();
    }

    /**
     * Get crop information from API based on crop name
     */
    getChatGPTInfoFromCropName() {
        const self = this;

        if (this.selectedStep.step.useDefaultColor == false &&
            this.selectedStep.step.useDefaultStartDate == false &&
            this.selectedStep.step.useDefaultEndDate == false) {
            // If the user has modified all fields, do not call the API again
            $('#itk-api-comment').text('');
            console.log("All fields modified by user, skipping API call");
            return;
        }

        let newCropName = $("#cropName").val();

        $('#itk-api-comment').html('<i class="fa fa-spinner fa-spin"></i> ...');

        $.ajax({
            url: "https://itk-info.tripleperformance.fr/api/culture",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                culture: newCropName,
                region: self.system.options.region ?? "France"
            }),
            success: function(data) {
                console.log("Réponse:", data);
                    
                if (data.color_hex && self.selectedStep.step.useDefaultColor) {
                    self.setInputValue("cropColor", data.color_hex);
                    self.updateSelectedStep();
                }
        
                let startDate = self.getRotationEndDate();
                if (data.average_sowing_date && self.selectedStep.step.useDefaultStartDate) {
                    // data.average_sowing_date is in MM-DD format, we need to convert it to YYYY-MM-DD
                    // for the current year
                    let currentYear = startDate.getFullYear();
                    startDate = new Date(`${currentYear}-${data.average_sowing_date}`);
                    // If the start date is before today, it means the crop starts next year
                    if (startDate < new Date()) {
                        startDate.setFullYear(startDate.getFullYear() + 1);
                    }
                    self.setInputValue("cropStartDate", startDate.toISOString().split('T')[0]);
                    self.updateSelectedStep();
                }

                if (data.end_of_season && self.selectedStep.step.useDefaultEndDate) {
                    // data.end_of_season is in MM-DD format, we need to convert it to YYYY-MM-DD
                    // for the current year
                    let currentYear = startDate.getFullYear();
                    let endDate = new Date(`${currentYear}-${data.end_of_season}`);
                    // If the end date is before the start date, it means the crop ends the next year
                    if (endDate < startDate) {
                        endDate.setFullYear(startDate.getFullYear() + 1);
                    }

                    self.setInputValue("cropEndDate", endDate.toISOString().split('T')[0]);
                    self.updateSelectedStep();
                }
                  
                if (data.source_explanation) {
                    $('#itk-api-comment').text(data.source_explanation);
                } else {
                    $('#itk-api-comment').text('');
                }
            },
            error: function(err) {
                console.error("Erreur:", err);
            }
        });        
    }

    /**
     * Attach input listeners to crop form fields
     */
    attachCropInputListeners() {
        const self = this;
        $("#cropName").on("input", _.debounce(function() { self.getChatGPTInfoFromCropName(); }, 1000));
        $("#cropName").on("input", _.debounce(function() { self.updateSelectedStep(); }, 500));
        $("#cropDescription").on("input", _.debounce(function() { self.updateSelectedStep(); }, 500));
        $("#cropStartDate").on("change", _.debounce(function() { self.updateSelectedStepStartDate(); }, 500));
        $("#cropEndDate").on("change", _.debounce(function() { self.updateSelectedStepEndDate(); }, 500));
        $("#cropColor").on("input", _.debounce(function() { self.updateSelectedStepColor(); }, 500));
        $("#cropSecondary").on("change", _.debounce(function() { self.updateSelectedStep(); }, 500));
    }

    /**
     * Enable title editing functionality
     */
    enableTitleEditing() {
        const self = this;
        document.getElementById("title").addEventListener("blur", function () {
            if (this.textContent.trim() === "") {
                this.textContent = self.DEFAULT_TITLE;
            }

            self.system.title = this.textContent;
            self.system.defaultTitle = false;
        });
    }

    /**
     * Add new step click event handler
     */
    addNewStepClickEvent() {
        this.createAndSelectEmptyCrop();
        this.loadSelectedStepToEditor(this.selectedStep);
        this.showStepEditor();

        this.InterventionTableManager.setupDiv();
        this.InterventionTableManager.refreshInterventionsTable(this.selectedStep);
                
        this.refreshAllTables();
    }

    /**
     * Create and select an empty crop
     */
    createAndSelectEmptyCrop() {
        let crop = new StepModel({
            startDate: this.getRotationEndDate(),
        });

        crop.setDurationInMonths(2);
        this.system.steps.push(crop.getStep());

        // Select last created crop to be editable
        this.selectedStep = crop;
    }

    /**
     * Load selected step to editor form
     */
    loadSelectedStepToEditor(aStep) {
        this.setInputValue("cropName", aStep.getStep().name);
        this.setInputValue("cropColor", aStep.getStep().color);
        this.setInputValue("cropStartDate", aStep.getStep().startDate.toISOString().split('T')[0]);
        this.setInputValue("cropEndDate", aStep.getStep().endDate.toISOString().split('T')[0]);
        this.setInputValue("cropDescription", aStep.getStep().description);
        document.getElementById("cropSecondary").checked = aStep.getStep().secondary_crop || false;
    }

    /**
     * Refresh the steps button list
     */
    refreshStepsButtonList() {
        let cropsContainer = $("#cropsContainer");
        cropsContainer.html('');

        this.system.steps.forEach((crop) => {
            const rowDiv = this.createCropRow(crop);
            cropsContainer.append(rowDiv);
        });
        
        cropsContainer.sortable("refresh");
    }

    addEditAndRemoveButtons(rowDiv, deleteId, editFunction, deleteFunction, duplicateFunction, style="btn-group") {
        rowDiv = $(rowDiv);

        let actionContainer = $(`<div class="col-auto edit-buttons m-1 ${style}" role="group"></div>`);

        rowDiv.append(actionContainer);

        actionContainer.append($('<button class="edit-button btn btn-outline-primary p-2"><i class="fa fa-pencil"></i></button>').click(function(event) {
            event.stopPropagation();
            editFunction();
        }));

        rowDiv.find('.col').click(function(event) {
            event.stopPropagation();
            editFunction();
        });

        if (duplicateFunction != null) {
            actionContainer.append($('<button class="btn btn-outline-secondary p-2"><i class="fa fa-copy"></i></button>').click(function (event) {
                event.stopPropagation();
                duplicateFunction(deleteId);
            }));
        }

        actionContainer.append($('<button class="btn btn-outline-danger p-2"><i class="fa fa-trash"></i></button>').click(function (event) {
            event.stopPropagation();
            deleteFunction(deleteId);
        }));
    }

    /**
     * Create a crop row element
     */
    createCropRow(crop) {
        const self = this;
        let step = new StepModel(crop); // in case crop is a plain object, convert to StepModel instance

        let rowDiv = $('<div class="row mb-2 step-row editable-row position-relative" data-id="'+step.getStep().id +'"></div>');

        rowDiv.append($('<div class="col"></div>')
            .append($('<i class="fa fa-bars drag-handle" aria-hidden="true"></i>'))
            .append($('<strong>' + step.getStep().name + '</strong>')));

        this.addEditAndRemoveButtons(rowDiv, 
            step.getStep().id, 
            function () {
                console.log("Selected step:", step.getStep().name);
                self.selectStep(step);
            },
            function(id) {
                self.system.steps = self.system.steps.filter(function (crop) { return crop.id != id });
                self.refreshAllTables();
                self.hideStepEditor();
            },
            function(id) {
                self.duplicateStep(id);
            });

        rowDiv.click();

        return rowDiv;
    }

    /**
     * Duplicate a step
     */
    duplicateStep(stepId) {
        // Find the step to duplicate
        let originalStep = this.system.steps.find(crop => crop.id === stepId);
        if (!originalStep) return;

        // Get the latest end date in the rotation
        let latestEndDate = this.getRotationEndDate();

        // Calculate the duration of the original step
        let originalStart = new Date(originalStep.startDate);
        let originalEnd = new Date(originalStep.endDate);

        // Calculate how many years to add to position after the latest step
        let yearsToAdd = 0;
        let newStartDate = new Date(originalStart);
        let newEndDate = new Date(originalEnd);

        // Keep adding years until the new start date is after the latest end date
        while (newStartDate < latestEndDate) {
            yearsToAdd++;
            newStartDate = new Date(originalStart);
            newStartDate.setFullYear(originalStart.getFullYear() + yearsToAdd);
            newEndDate.setFullYear(originalEnd.getFullYear() + yearsToAdd);
        }

        // Create the new step with all properties cloned
        let newStep = {
            name: originalStep.name,
            color: originalStep.color,
            startDate: newStartDate,
            endDate: newEndDate,
            description: originalStep.description,
            secondary_crop: originalStep.secondary_crop || false,
            useDefaultColor: originalStep.useDefaultColor,
            useDefaultStartDate: originalStep.useDefaultStartDate,
            useDefaultEndDate: originalStep.useDefaultEndDate,
            interventions: originalStep.interventions ? originalStep.interventions.map(i => ({
                day: i.day,
                name: i.name,
                type: i.type,
                description: i.description
            })) : []
        };

        // Create a StepModel instance to ensure proper initialization
        let stepModel = new StepModel(newStep);
        
        // Add the duplicated step to the rotation
        this.system.steps.push(stepModel.getStep());

        // Refresh the UI
        this.refreshAllTables();
    }

    /**
     * Select a step for editing
     */
    selectStep(step) {
        this.selectedStep = step;
        this.loadSelectedStepToEditor(this.selectedStep);
        this.showStepEditor();

        this.InterventionTableManager.setupDiv();
        this.InterventionTableManager.refreshInterventionsTable(this.selectedStep);
    }
}
