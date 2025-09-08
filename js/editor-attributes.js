function addOrUpdateAttributeClickEvent() {
    let id = getInputValue("attributeId");
    let key = getInputValue("attributeName");
    let value = getInputValue("attributeValue");

    if (id != "") {
        selectedStep.updateAttribute(id, key, value);
    } else {
        selectedStep.addAttribute(key, value);

        document.getElementById("newAttributeButton").classList.remove("d-none");
        getAndCleanElement("newAttributeContainer");
    }

    refreshAllTables();
}

function refreshAttributesTable() {
    let attributesContainer = document.getElementById("attributesContainer");
    attributesContainer.innerHTML = "";

    if (selectedStep && selectedStep.getStep().attributes) {
        selectedStep.getStep().attributes.forEach((attribute) => {
            const rowDiv = createAttributeRow(attribute);
            attributesContainer.appendChild(rowDiv);
        });
    }
}

function createAttributeRow(attribute) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "row mb-2 attribute-row editable-row position-relative";

    let nameValueDiv = createAttributeNameAndValueColumn(attribute);
    rowDiv.appendChild(nameValueDiv);

    addEditAndRemoveButtons(
        rowDiv, 
        attribute.id, 
        function() {
            createAttributForm(attribute.id, attribute.name, attribute.value, rowDiv);
        },
        function(id) {
            selectedStep.removeAttribute(id);
            refreshAllTables();
        });

    return rowDiv;
}

function createAttributeNameAndValueColumn(attribute) {
    let nameValueDiv = document.createElement("div");
    nameValueDiv.className = "col";
    nameValueDiv.innerHTML = `<strong>${attribute.name}</strong></br> ${attribute.value}`;

    return nameValueDiv;
}

function createAttributForm(id, name, value, row) {
    id = id || "";
    name = name || "";
    value = value || "";

    const formContainer = document.createElement("div");
    formContainer.innerHTML = `
        <form>
            <div class="row card-white edit-attribute-view mb-2">
                <input type="hidden" id="attributeId" value="${id}">
                <div class="col-12 mb-2">
                    <label for="attributeName" class="form-label">Nom</label>
                    <input type="text" id="attributeName" class="form-control" placeholder="Nom" value="${name}">
                </div>
                <div class="col-12 mb-2">
                    <input type="text" id="attributeValue" class="form-control" placeholder="Description" value="${value}">
                </div>
                <div class="col-12 mb-2">
                    <button type="button" onclick="addOrUpdateAttributeClickEvent()"
                        class="w-100 btn btn-outline-primary primary-button">Valider</button>
                </div>
            </div>
        </form>
    `;

    if (row) { //we are editing an attribute
        row.replaceWith(formContainer);
    } else { //we are adding an attribute
        document.getElementById("newAttributeContainer").appendChild(formContainer);
        document.getElementById("newAttributeButton").classList.add("d-none");
    }

    if (name === "") {
        document.getElementById("attributeName").focus();
    } else {
        document.getElementById("attributeValue").focus();
    }
}