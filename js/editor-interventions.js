function addInterventionClickEvent() {
    let id = getInputValue("interventionId");
    let name = getInputValue("interventionName");
    let day = getInputValue("interventionDay");
    let type = getInputValue("interventionType");
    let description = getInputValue("interventionDescription");

    if (id != "") {
        selectedCrop.updateIntervention(id, day, name, type, description);
    } else {
        selectedCrop.addIntervention(day, name, type, description);

        document.getElementById("newInterventionButton").classList.remove("d-none");
        getAndCleanElement("newInterventionContainer");
    }
    refreshAllTables();
}

function refreshInterventionsTable() {
    let interventionsTopContainer = getAndCleanElement("interventionsTopContainer");
    let interventionsBottomContainer = getAndCleanElement("interventionsBottomContainer");

    if (selectedCrop && selectedCrop.interventions) {
        selectedCrop.interventions.forEach((intervention) => {
            const rowDiv = createInterventionRow(intervention);

            if (intervention.type === crops.options.title_top_interventions) {
                interventionsTopContainer.appendChild(rowDiv);
            } else {
                interventionsBottomContainer.appendChild(rowDiv);
            }

        });
    }
}

function createInterventionRow(intervention) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "row mb-2 attribute-row position-relative";

    let nameValueDiv = createInterventionNameAndValueColumn(intervention);
    rowDiv.appendChild(nameValueDiv);

    let actionContainer = createActionContainer(rowDiv, intervention.id, deleteCropIntervention);
    rowDiv.appendChild(actionContainer);

    rowDiv.onclick = function () {
        createInterventionForm(intervention.id, intervention.day, intervention.name, intervention.type, intervention.description, rowDiv);
    };

    return rowDiv;
}

function createInterventionNameAndValueColumn(intervention) {
    let nameValueDiv = document.createElement("div");
    nameValueDiv.className = "col";
    nameValueDiv.innerHTML = `<strong>${intervention.name}</strong></br> ${intervention.description}`;

    return nameValueDiv;
}

function deleteCropIntervention(id) {
    selectedCrop.removeIntervention(id);
    refreshAllTables();
}

function createInterventionForm(id, day, name, type, description, row) {
    id = id || "";
    day = day || "";
    name = name || "";
    type = type || "";
    description = description || "";

    const formContainer = document.createElement("div");
    formContainer.innerHTML =
        `<form id="interventionForm">
            <div class="row card-white mb-2">
                <input type="hidden" id="interventionId" value="${id}">
                <div class="col-12 mb-2">
                    <label for="interventionName" class="form-label">Nom</label>
                    <input type="text" id="interventionName" class="form-control" placeholder="Nom" value="${name}">
                </div>
                <div class="col-12 mb-2">
                    <textarea id="interventionDescription" class="form-control"
                        placeholder="Ajouter une description">${description}</textarea>
                </div>
                <div class="col-12 mb-2">
                    <label for="interventionDay" class="form-label">Quel jour après la plantation ?</label>
                    <input type="number" id="interventionDay" class="form-control" placeholder="Jour"
                        value="${day}">
                </div>
                <div class="col-12 mb-2">
                    <select id="interventionType" class="form-select" aria-label="Type">
                        <option value="${crops.options.title_top_interventions}" 
                        ${type === crops.options.title_top_interventions ? "selected" : ""}>${crops.options.title_top_interventions}</option>
                        <option value="${crops.options.title_bottom_interventions}" 
                        ${type === crops.options.title_bottom_interventions ? "selected" : ""}>${crops.options.title_bottom_interventions}</option>
                    </select>
                </div>

                <div class="col">
                    <button type="button" onclick="addInterventionClickEvent()"
                        class="w-100 btn btn-outline-primary primary-button">Valider</button>
                </div>
            </div>
        </form>
    `;

    if (row) { //we are editing an intervention
        row.replaceWith(formContainer);
    } else { //we are adding an intervention
        document.getElementById("newInterventionContainer").appendChild(formContainer);
        document.getElementById("newInterventionButton").classList.add("d-none");
    }

    $("#interventionName").focus();
}