function addInterventionClickEvent() {
    let id = getInputValue("interventionId");
    let name = getInputValue("interventionName");
    let day = getInputValue("interventionDay");
    let type = getInputValue("interventionType");
    let description = getInputValue("interventionDescription");

    if (id != "") {
        selectedStep.updateIntervention(id, day, name, type, description);
    } else {
        selectedStep.addIntervention(day, name, type, description);

        document.getElementById("newInterventionButton").classList.remove("d-none");
        getAndCleanElement("newInterventionContainer");
    }
    refreshAllTables();
}

function refreshInterventionsTable() {
    let interventionsTopContainer = getAndCleanElement("interventionsTopContainer");
    let interventionsBottomContainer = getAndCleanElement("interventionsBottomContainer");

    if (selectedStep && selectedStep.getStep().interventions) {
        selectedStep.getStep().interventions.forEach((intervention) => {
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
    rowDiv.className = "row mb-2 intervention-row editable-row position-relative";

    let nameValueDiv = createInterventionNameAndValueColumn(intervention);
    rowDiv.appendChild(nameValueDiv);

    addEditAndRemoveButtons(
        rowDiv,
        intervention.id,
        function () {
            createInterventionForm(intervention.id, intervention.day, intervention.name, intervention.type, intervention.description, rowDiv);
        },
        function(id) {
            selectedStep.removeIntervention(id);
            refreshAllTables();
        }
    );

    return rowDiv;
}

function createInterventionNameAndValueColumn(intervention) {
    let nameValueDiv = document.createElement("div");
    nameValueDiv.className = "col";
    nameValueDiv.innerHTML = `<strong>${intervention.name}</strong></br> ${intervention.description}`;

    return nameValueDiv;
}

function createInterventionForm(id, day, name, type, description, row) {
    id = id || "";
    day = day || "";
    name = name || "";
    type = type || "";
    description = description || "";

    // Calculate absolute date from relative day
    let absoluteDate = "";
    if (day == "")
        day = 0;
    
    if (selectedStep && selectedStep.getStep().startDate) {
        const stepStartDate = new Date(selectedStep.getStep().startDate);
        const interventionDate = new Date(stepStartDate);
        interventionDate.setDate(stepStartDate.getDate() + parseInt(day));
        absoluteDate = interventionDate.toISOString().split('T')[0];
    }

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
                <div class="col-4 mb-2">
                    <label for="interventionDay" class="form-label">Jour relatif</label>
                    <input type="number" id="interventionDay" class="form-control text-right" placeholder="Jour"
                        value="${day}">
                </div>
                <div class="col-8 mb-2">
                    <label for="interventionDate" class="form-label">Date absolue</label>
                    <input type="date" id="interventionDate" class="form-control" value="${absoluteDate}">
                </div>
                <div class="col-12 mb-2">
                    <select id="interventionType" class="form-select" aria-label="Type">
                        <option value="intervention_top" 
                        ${type === "intervention_top" ? "selected" : ""}>${crops.options.title_top_interventions}</option>
                        <option value="intervention_bottom" 
                        ${type === "intervention_bottom" ? "selected" : ""}>${crops.options.title_bottom_interventions}</option>
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

    // Add event listeners for date synchronization
    setupInterventionDateListeners();

    $("#interventionName").focus();
}

function setupInterventionDateListeners() {
    // When relative day changes, update absolute date
    $("#interventionDay").on("input change", function() {
        updateAbsoluteDateFromRelative();
    });

    // When absolute date changes, update relative day
    $("#interventionDate").on("change", function() {
        updateRelativeDayFromAbsolute();
    });
}

function updateAbsoluteDateFromRelative() {
    const relativeDay = $("#interventionDay").val();
    if (relativeDay == "")
        relativeDay = 0;

    if (selectedStep && selectedStep.getStep().startDate) {
        const stepStartDate = new Date(selectedStep.getStep().startDate);
        const interventionDate = new Date(stepStartDate);
        interventionDate.setDate(stepStartDate.getDate() + parseInt(relativeDay));
        
        const absoluteDateStr = interventionDate.toISOString().split('T')[0];
        $("#interventionDate").val(absoluteDateStr);
    }
}

function updateRelativeDayFromAbsolute() {
    const absoluteDate = $("#interventionDate").val();
    if (absoluteDate !== "" && selectedStep && selectedStep.getStep().startDate) {
        const stepStartDate = new Date(selectedStep.getStep().startDate);
        const interventionDate = new Date(absoluteDate);
        
        // Calculate difference in days
        const timeDiff = interventionDate.getTime() - stepStartDate.getTime();
        const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        
        $("#interventionDay").val(dayDiff);
    }
}