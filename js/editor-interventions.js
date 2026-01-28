/**
 * InterventionTable class - Manages interventions UI and interactions
 */
class InterventionTable {

    // Constructor
    constructor(interventionsTopTitle, interventionsBottomTitle, tikaEditorInstance) {
        this.selectedStep = null;
        this.interventionsTopTitle = interventionsTopTitle;
        this.interventionsBottomTitle = interventionsBottomTitle;
        this.tikaEditorInstance = tikaEditorInstance;
    }

    /**
     * Setup the interventions table div dynamically
     */
    setupDiv() {

        // Check if the div already exists
        if ($('#interventionsTable').length > 0) {
            return; // Already created
        }

        const interventionsTableDiv = $(`
            <div id="interventionsTable" class="row card-holder">
                <div class="col-12">
                    <h5>Interventions</h5>
                    <div class="row">
                        <p id="interventionsTopName" class="h6">${this.interventionsTopTitle}</p>
                        <div id="interventionsTopContainer" class="container"></div>
                    </div>
                    <hr class="my-2">
                    <div class="row">
                        <p id="interventionsBottomName" class="h6">${this.interventionsBottomTitle}</p>
                        <div id="interventionsBottomContainer" class="container"></div>
                    </div>

                    <button id="newInterventionButton" type="button"
                        class="btn btn-primary primary-button w-100"><i class="fa fa-plus-square"
                            aria-hidden="true"></i> Ajouter</button>
                    <div id="newInterventionContainer"></div>
                </div>
            </div>
        `);
        
        // Insert after the step's details
        $('#cropDetailView').after(interventionsTableDiv);
        
        const self = this;

        $('#newInterventionButton').on('click', function(e) {
            e.preventDefault();
            self.showInterventionForm();
        });
    }

    getAndCleanElement(elementId) {
        let element = document.getElementById(elementId);
        element.innerHTML = "";
        return element;
    }

    refreshInterventionsTable(selectedStep) {
        this.selectedStep = selectedStep;

        let interventionsTopContainer = this.getAndCleanElement("interventionsTopContainer");
        let interventionsBottomContainer = this.getAndCleanElement("interventionsBottomContainer");

        if (this.selectedStep.getStep().interventions) {
            // Sort all interventions by day
            this.selectedStep.getStep().interventions = this.selectedStep.getStep().interventions.sort((a, b) => a.day - b.day);        
            
            this.selectedStep.getStep().interventions.forEach((intervention) => {
                const rowDiv = this.createInterventionRow(intervention);

                if (intervention.type === 'intervention_top') {
                    $("#interventionsTopContainer").append(rowDiv);
                } else {
                    $("#interventionsBottomContainer").append(rowDiv);
                }
            });
        }
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

    createInterventionRow(intervention) {
        const self = this;
        let rowDiv = document.createElement("div");
        rowDiv.className = "row mb-2 intervention-row editable-row position-relative";
        rowDiv.id = `interventionRow_${intervention.id}`;

        let nameValueDiv = self.createInterventionNameAndValueColumn(intervention);
        rowDiv.appendChild(nameValueDiv);

        this.addEditAndRemoveButtons(
            rowDiv,
            intervention.id,
            function () {
                self.showInterventionForm(intervention, rowDiv);
            },
            function(id) {
                self.selectedStep.removeIntervention(id);
                $(`#interventionRow_${id}`).remove();
                self.tikaEditorInstance.renderChart();
            },
            function(id) {
                const newIntervention = self.duplicateIntervention(id);
                const div = self.createInterventionRow(newIntervention);
                if (newIntervention.type === 'intervention_top') {
                    $("#interventionsTopContainer").append(div);
                } else {
                    $("#interventionsBottomContainer").append(div);
                }
                self.tikaEditorInstance.renderChart();
            },
            'btn-group-vertical'
        );

        return rowDiv;
    }

    createInterventionNameAndValueColumn(intervention) {
        let absoluteDate = "";
        if (this.selectedStep && this.selectedStep.getStep().startDate) {
            const stepStartDate = new Date(this.selectedStep.getStep().startDate);
            const interventionDate = new Date(stepStartDate);
            interventionDate.setDate(stepStartDate.getDate() + parseInt(intervention.day));
            absoluteDate = interventionDate.toLocaleDateString('fr-FR', {
                month: "short",
                day: "numeric",
            });
        }
        
        let nameValueDiv = document.createElement("div");
        nameValueDiv.className = "col";
        nameValueDiv.innerHTML = `<strong>${intervention.name}</strong> (${absoluteDate})</br> ${intervention.description}`;

        return nameValueDiv;
    }

    showInterventionForm(intervention, row) {
        const self = this;
        let id = intervention?.id || "";
        let day = intervention?.day || "";
        let name = intervention?.name || "";
        let type = intervention?.type || "";
        let description = intervention?.description || "";

        // Calculate absolute date from relative day
        let absoluteDate = "";
        if (day === "")
            day = 0;
        
        if (this.selectedStep && this.selectedStep.getStep().startDate) {
            const stepStartDate = new Date(this.selectedStep.getStep().startDate);
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
                            ${type === "intervention_top" ? "selected" : ""}>${this.interventionsTopTitle}</option>
                            <option value="intervention_bottom" 
                            ${type === "intervention_bottom" ? "selected" : ""}>${this.interventionsBottomTitle}</option>
                        </select>
                    </div>

                    <div class="col">
                        <button type="button" class="ValidateInterventionFormButton w-100 btn btn-outline-primary primary-button">Valider</button>
                    </div>
                </div>
            </form>
        `;

        // Add the addInterventionClickEvent listener to the button
        const form = $(formContainer);
        form.find(".ValidateInterventionFormButton").on("click", (e) => {
            e.preventDefault();

            let id = form.find("#interventionId").val();
            let name = form.find("#interventionName").val();
            let day = form.find("#interventionDay").val();
            let type = form.find("#interventionType").val();
            let description = form.find("#interventionDescription").val();

            if (id != "") {
                intervention.name = name;
                intervention.day = day;
                intervention.type = type;
                intervention.description = description;

                // Also update the row display
                const updatedRowDiv = this.createInterventionRow(this.selectedStep.getStep().interventions.find(itv => itv.id === id));
                $(formContainer).replaceWith(updatedRowDiv);

            } else {
                this.selectedStep.addIntervention(day, name, type, description);

                $("#newInterventionButton").show();
                this.getAndCleanElement("newInterventionContainer");

                // Add the new intervention to the table
                const newIntervention = this.selectedStep.getStep().interventions[this.selectedStep.getStep().interventions.length - 1];
                const newRowDiv = this.createInterventionRow(newIntervention);
                if (newIntervention.type === 'intervention_top') {
                    $("#interventionsTopContainer").append(newRowDiv);
                } else {
                    $("#interventionsBottomContainer").append(newRowDiv);
                }
                    
                // Remove the form
                formContainer.remove();
            }            

            self.tikaEditorInstance.renderChart();
        });
        
        if (row) { //we are editing an intervention
            row.replaceWith(formContainer);
        } else { //we are adding an intervention
            $("#newInterventionContainer").append(formContainer);
            $("#newInterventionButton").hide();
        }

        // Add event listeners for date synchronization
        // When relative day changes, update absolute date
        form.find("#interventionDay").on("input change", function() {
            self.updateAbsoluteDateFromRelative();
        });

        // When absolute date changes, update relative day
        form.find("#interventionDate").on("change", function() {
            self.updateRelativeDayFromAbsolute();
        });
        
        form.find("#interventionName").focus();
    }

    updateAbsoluteDateFromRelative() {
        const relativeDay = $("#interventionDay").val();
        if (relativeDay == "")
            relativeDay = 0;

        if (this.selectedStep && this.selectedStep.getStep().startDate) {
            const stepStartDate = new Date(this.selectedStep.getStep().startDate);
            const interventionDate = new Date(stepStartDate);
            interventionDate.setDate(stepStartDate.getDate() + parseInt(relativeDay));
            
            const absoluteDateStr = interventionDate.toISOString().split('T')[0];
            $("#interventionDate").val(absoluteDateStr);
        }
    }

    updateRelativeDayFromAbsolute() {
        const absoluteDate = $("#interventionDate").val();
        if (absoluteDate !== "" && this.selectedStep && this.selectedStep.getStep().startDate) {
            const stepStartDate = new Date(this.selectedStep.getStep().startDate);
            const interventionDate = new Date(absoluteDate);
            
            // Calculate difference in days
            const timeDiff = interventionDate.getTime() - stepStartDate.getTime();
            const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
            
            $("#interventionDay").val(dayDiff);
        }
    }

    duplicateIntervention(interventionId) {
        if (!this.selectedStep) return;

        // Find the intervention to duplicate
        let originalIntervention = this.selectedStep.getStep().interventions.find(interv => interv.id === interventionId);
        if (!originalIntervention) return;

        // Create a copy of the intervention
        let newIntervention = {
            id: crypto.randomUUID(),
            day: Number(originalIntervention.day) + 15, // Offset by 15 days to avoid overlap
            name: originalIntervention.name,
            type: originalIntervention.type,
            description: originalIntervention.description
        };

        // Add the duplicated intervention to the selected step
        this.selectedStep.getStep().interventions.push(newIntervention);

        return newIntervention;
    }
}
