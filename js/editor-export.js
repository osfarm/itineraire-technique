function exportToJsonFile(data, fileName = 'export-itk.json') {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
}

function importFromJsonFile() {
    if (crops.steps && crops.steps.length > 0) {
        showConfirmationModal(() => {
            openFileInput();
        });
    } else {
        openFileInput();
    }
}

function importFromTestJson() {
    if (crops.steps && crops.steps.length > 0) {
        showConfirmationModal(() => {
            importTestJSON();
        });
    } else {
        importTestJSON();
    }    
}

function importTestJSON() {
  fetch('test/test.json')
    .then(response => {
      if (!response.ok) {
        throw new Error("Erreur HTTP " + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Données JSON :", data);
      reloadCropsFromJson(data);
    })
    .catch(error => {
      console.error("Impossible de charger le JSON :", error);
    });
}

function wipe() {
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

    if (crops.steps && crops.steps.length > 0) {
        showConfirmationModal(() => {
            reloadCropsFromJson(crops);
        });
    } else {
        reloadCropsFromJson(crops);
    } 
}

function openFileInput() {
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
                    reloadCropsFromJson(jsonData);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    showJsonErrorModal(error.message);
                }
            };
            reader.readAsText(file);
        }
    });

    input.click();
}

function showJsonErrorModal(errorMessage) {
    const errorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
    document.getElementById('jsonErrorMessage').textContent = errorMessage;
    errorModal.show();
}

function showConfirmationModal(onConfirm) {
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
