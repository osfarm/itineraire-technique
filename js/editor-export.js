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

function importFromJsonFile(callback) {
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
                    let parsedCrops = parseCropsFromJson(jsonData);
                    callback(parsedCrops);
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

function parseCropsFromJson(cropsFromJson) {
    return {
        title: cropsFromJson.title || "",
        options: cropsFromJson.options || {},
        steps: cropsFromJson.steps?.map(step => {
            const crop = new Crop(
                step.name || "",
                step.color || "",
                new Date(step.startDate),
                new Date(step.endDate),
                step.description || ""
            );

            crop.interventions = step.interventions?.map(parseIntervention);
            crop.attributes = step.attributes?.map(parseAttribute);

            return crop;
        })
    };
}

function parseIntervention(intervention) {
    return new Intervention(
        intervention.day || 0,
        intervention.name || "",
        intervention.type || "",
        intervention.description || ""
    );
}

function parseAttribute(attribute) {
    return new Attribute(
        attribute.name || "",
        attribute.value || ""
    );
}