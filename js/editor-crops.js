function addNewStepClickEvent() {
    createAndSelectEmptyCrop();
    loadSelectedStepToEditor(selectedStep);
    displayCropDetailView();
    refreshAllTables();
}

function createAndSelectEmptyCrop() {
    let crop = new StepModel({
        startDate: getRotationEndDate(),
    });

    crop.setDurationInMonths(2)
    crops.steps.push(crop.getStep());

    //select last created crop to be editable
    selectedStep = crop;
}

function loadSelectedStepToEditor(aStep) {
    setInputValue("cropName", aStep.getStep().name);
    setInputValue("cropColor", aStep.getStep().color);
    setInputValue("cropStartDate", aStep.getStep().startDate.toISOString().split('T')[0]);
    setInputValue("cropEndDate", aStep.getStep().endDate.toISOString().split('T')[0]);
    setInputValue("cropDescription", aStep.getStep().description);
    document.getElementById("cropSecondary").checked = aStep.getStep().secondary_crop || false;
}

function refreshStepsButtonList() {
    let cropsContainer = $("#cropsContainer");
    cropsContainer.html('');

    crops.steps.forEach((crop) => {
        const rowDiv = createCropRow(crop);
        cropsContainer.append(rowDiv);
    });
    
    cropsContainer.sortable("refresh");
}

function createCropRow(crop) {
    let step = new StepModel(crop); // in case crop is a plain object, convert to Crop instance

    let rowDiv = $('<div class="row mb-2 step-row editable-row position-relative" data-id="'+step.getStep().id +'"></div>');

    rowDiv.append($('<div class="col"></div>')
        .append($('<i class="fa fa-bars drag-handle" aria-hidden="true"></i>'))
        .append($('<strong>' + step.getStep().name + '</strong>')));

    addEditAndRemoveButtons(rowDiv, 
        step.getStep().id, 
        function () {
            console.log("Selected step:", step.getStep().name);
            SelectStep(step);
        },
        function(id) {
            crops.steps = crops.steps.filter(function (crop) { return crop.id != id })

            refreshAllTables();
            displayCropListView();
        },
        function(id) {
            duplicateStep(id);
        });

    rowDiv.click();

    return rowDiv;
}

function duplicateStep(stepId) {
    // Find the step to duplicate
    let originalStep = crops.steps.find(crop => crop.id === stepId);
    if (!originalStep) return;

    // Get the latest end date in the rotation
    let latestEndDate = getRotationEndDate();

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
        })) : [],
        attributes: originalStep.attributes ? originalStep.attributes.map(a => ({
            name: a.name,
            value: a.value
        })) : []
    };

    // Create a StepModel instance to ensure proper initialization
    let stepModel = new StepModel(newStep);
    
    // Add the duplicated step to the rotation
    crops.steps.push(stepModel.getStep());

    // Refresh the UI
    refreshAllTables();
}

function SelectStep(crop) {
    selectedStep = crop;
    loadSelectedStepToEditor(selectedStep);
    displayCropDetailView();

    refreshAttributesTable();
    refreshInterventionsTable();
}