/**
 * DefaultLoader - Parent class for WikiLoader and ItineraLoader
 * Provides common functionality for import/export and button setup
 */
class DefaultLoader {
    constructor(tikaeditorInstance = null) {
        this.tikaeditorInstance = tikaeditorInstance;
    }

    /**
     * Setup buttons dynamically in the toolbar
     * Default implementation for standalone mode (NonWikiButtons)
     * Can be overridden by child classes for Wiki/Itinera specific buttons
     */
    setupButtons() {
        const self = this;
        const container = '#toolbar-buttons-container';
        
        // Create the NonWikiButtons div structure for standalone mode
        const nonWikiButtonsDiv = $(`
            <div id="NonWikiButtons" class="">
                <div class="btn-group me-2" role="group">
                    <button type="button" class="btn btn-outline-primary primary-button btn-import-json">
                        <i class="fa fa-upload" aria-hidden="true"></i> Charger une rotation
                    </button>
                    <button type="button" class="btn btn-outline-primary primary-button dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="visually-hidden">Autres options de chargement</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item btn-import-test" href="#"><i class="fa fa-lightbulb-o" aria-hidden="true"></i> Charger un exemple</a></li>
                    </ul>
                </div>
                <button type="button" class="btn btn-outline-primary primary-button me-2 btn-export-json">
                    <i class="fa fa-download" aria-hidden="true"></i> Exporter (JSON)
                </button>
            </div>
        `);
        
        // Clear container and append the new buttons
        $(container).empty().append(nonWikiButtonsDiv);
        
        // Attach event handlers
        nonWikiButtonsDiv.find('.btn-import-json').on('click', function(e) {
            e.preventDefault();
            self.importFromJsonFile();
        });
        
        nonWikiButtonsDiv.find('.btn-import-test').on('click', function(e) {
            e.preventDefault();
            self.importFromTestJson();
        });
        
        nonWikiButtonsDiv.find('.btn-export-json').on('click', function(e) {
            e.preventDefault();
            self.doExportToJsonFile();
        });
        
        // Add wipe button
        this.addWipeButton();
    }

    /**
     * Add the wipe button dynamically to the toolbar
     */
    addWipeButton() {
        const self = this;
        const container = '#toolbar-buttons-container';
        
        const wipeButton = $(`
            <button type="button" id="wipe-button" class="btn btn-outline-primary primary-button">
                <i class="fa fa-trash" aria-hidden="true"></i> Tout effacer
            </button>
        `);
        
        $(container).append(wipeButton);
        
        wipeButton.on('click', function(e) {
            e.preventDefault();
            self.wipe();
        });
    }

    /**
     * Export crops to JSON file
     */
    doExportToJsonFile() {
        let jsonName = this.tikaeditorInstance.system.title.replace(/\s+/g, '-').toLowerCase() + ".json";
        this.exportToJsonFile(this.tikaeditorInstance.system, jsonName);
    }

    /**
     * Export data to JSON file
     */
    exportToJsonFile(data, fileName = 'export-itk.json') {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import from JSON file with confirmation
     */
    importFromJsonFile() {
        this.showConfirmationModal(() => {
            this.openFileInput();
        });
    }

    /**
     * Import from test JSON with confirmation
     */
    importFromTestJson() {
        this.showConfirmationModal(() => {
            this.importTestJSON();
        });
    }

    /**
     * Load and import test JSON file
     */
    importTestJSON() {
        const self = this;

        fetch('test/test.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur HTTP " + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Données JSON :", data);
                data.steps.forEach(step => {
                    let sm = new StepModel(step);
                    sm.setAsEdited();
                });
                self.tikaeditorInstance.reloadCropsFromJson(data);
            })
            .catch(error => {
                console.error("Impossible de charger le JSON :", error);
            });
    }

    /**
     * Wipe/reset all crops data
     */
    wipe() {
        const self = this;

        const DEFAULT_TITLE = "Nouvel itinéraire technique";
        this.showConfirmationModal(() => {
            let crops = {
                "title": DEFAULT_TITLE,
                "options": {
                    "view": "horizontal",
                    "show_transcript": true,
                    "title_top_interventions": "Contrôle adventices",
                    "title_bottom_interventions": "Autres interventions",
                    "title_steps": "Étapes de la rotation dans la parcelle",
                },
                "steps": []
            };

            self.tikaeditorInstance.reloadCropsFromJson(crops);
        });
    }

    /**
     * Open file input dialog for JSON import
     */
    openFileInput() {
        const self = this;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const jsonData = JSON.parse(reader.result);
                        jsonData.steps.forEach(step => {
                            let sm = new StepModel(step);
                            sm.setAsEdited();
                        });
                        self.tikaeditorInstance.reloadCropsFromJson(jsonData);
                    } catch (error) {
                        console.error("Error parsing JSON file:", error);
                        this.showJsonErrorModal(error.message);
                    }
                };
                reader.readAsText(file);
            }
        });

        input.click();
    }

    /**
     * Show JSON error modal
     */
    showJsonErrorModal(errorMessage) {
        const errorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
        document.getElementById('jsonErrorMessage').textContent = errorMessage;
        errorModal.show();
    }

    /**
     * Show confirmation modal before potentially destructive operations
     */
    showConfirmationModal(onConfirm) {
        if (this.tikaeditorInstance.system?.steps.length === 0)
            return onConfirm();

        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        const confirmButton = document.getElementById('confirmImport');

        // Avoid multiple event listeners
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.replaceWith(newConfirmButton);

        newConfirmButton.addEventListener('click', () => {
            confirmationModal.hide();
            onConfirm();
        });

        confirmationModal.show();
    }
}
