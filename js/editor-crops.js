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
        });

    rowDiv.click();

    return rowDiv;
}

function SelectStep(crop) {
    selectedStep = crop;
    loadSelectedStepToEditor(selectedStep);
    displayCropDetailView();
}