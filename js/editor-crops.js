function addNewCropClickEvent() {
    createAndSelectEmptyCrop();
    loadSelectedCropToEditor();
    displayCropDetailView();
    refreshAllTables();
}

function createAndSelectEmptyCrop() {
    let crop = new Crop();
    crop.startDate = getLatestEndDate();
    crop.setDurationInMonths(2)
    crops.steps.push(crop);

    crop.addAttribute("Pré-semis", "");
    crop.addAttribute("Travail du sol", "");
    crop.addAttribute("Type de semoir", " ");
    crop.addAttribute("Date des semis", "");

    //select last created crop to be editable
    selectedCrop = crop;
}

function loadSelectedCropToEditor() {
    setInputValue("cropName", selectedCrop.name);
    setInputValue("cropColor", selectedCrop.color);
    setInputValue("cropStartDate", selectedCrop.startDate.toISOString().split('T')[0]);
    setInputValue("cropEndDate", selectedCrop.endDate.toISOString().split('T')[0]);
    setInputValue("cropDescription", selectedCrop.description);
}

function refreshCropsTable() {
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

    let nameDiv = createCropNameColumn(crop);
    rowDiv.appendChild(nameDiv);

    let actionContainer = createActionContainer(rowDiv, crop.id, deleteCrop);
    rowDiv.appendChild(actionContainer);

    rowDiv.onclick = function () {
        console.log("Crop selected:", crop.name);
        selectCrop(crop.id);
    };

    return rowDiv;
}

function createCropNameColumn(crop) {
    let nameDiv = document.createElement("div");
    nameDiv.className = "col";
    nameDiv.innerHTML = `<strong>${crop.name}</strong>`;

    return nameDiv;
}

function deleteCrop(id) {
    crops.steps = crops.steps.filter(function (crop) { return crop.id != id })

    refreshAllTables();
    displayCropListView();
}

function selectCrop(cropId) {
    selectedCrop = crops.steps.find(x => x.id == cropId);
    loadSelectedCropToEditor();
    displayCropDetailView();
    refreshAllTables();
}