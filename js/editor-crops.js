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

    crop.addAttribute("Pré-semis", "");
    crop.addAttribute("Travail du sol", "");
    crop.addAttribute("Type de semoir", " ");
    crop.addAttribute("Date des semis", "");

    //select last created crop to be editable
    selectedStep = crop;
}

function loadSelectedStepToEditor(aStep) {
    setInputValue("cropName", aStep.getStep().name);
    setInputValue("cropColor", aStep.getStep().color);
    setInputValue("cropStartDate", aStep.getStep().startDate.toISOString().split('T')[0]);
    setInputValue("cropEndDate", aStep.getStep().endDate.toISOString().split('T')[0]);
    setInputValue("cropDescription", aStep.getStep().description);
}

function refreshStepsButtonList() {
    let cropsContainer = document.getElementById("cropsContainer");
    cropsContainer.innerHTML = "";

    crops.steps.forEach((crop) => {
        const rowDiv = createCropRow(crop);
        cropsContainer.appendChild(rowDiv);
    });
}

function createCropRow(crop) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "row mb-2 attribute-row position-relative";

    crop = new StepModel(crop); // in case crop is a plain object, convert to Crop instance

    let nameDiv = createCropNameColumn(crop);
    rowDiv.appendChild(nameDiv);

    let actionContainer = createActionContainer(rowDiv, crop.getStep().id, deleteCrop);
    rowDiv.appendChild(actionContainer);

    rowDiv.onclick = function () {
        console.log("Selected step:", crop.getStep().name);
        SelectStep(crop);
    };

    return rowDiv;
}

function createCropNameColumn(crop) {
    let nameDiv = document.createElement("div");
    nameDiv.className = "col";
    nameDiv.innerHTML = `<strong>${crop.getStep().name}</strong>`;

    return nameDiv;
}

function deleteCrop(id) {
    crops.steps = crops.steps.filter(function (crop) { return crop.id != id })

    refreshAllTables();
    displayCropListView();
}

function SelectStep(crop) {
    selectedStep = crop;
    loadSelectedStepToEditor(selectedStep);
    displayCropDetailView();
    refreshAllTables();
}