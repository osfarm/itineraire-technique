// Encapsulate the wiki editor functionality
class ItineraEditor {
    constructor() {
        // Initialize any properties if needed
        this.systemID = null;
    }

    /**
     * When the page loads, get the URL paremeter with the target page title we want to edit:
     * @returns 
     */
    loadPageFromURL() {
        
        const self = this;

        const urlParams = new URLSearchParams(window.location.search);
        self.systemID = urlParams.get('itinera');

        if (!self.systemID)
            return; // No page title provided, we are not in wiki edit mode

        // If a page title is provided, load its content from /api/systems/1
        fetch(`/api/systems/${encodeURIComponent(self.systemID)}`, {
            credentials: 'same-origin'
        })
        .then(response => {
            let res = response.json();
            return res;
        })
        .then(data => {
            if (data.json) {
                try {
                    const content = data.json;
                    content.steps.forEach(step => {
                        let sm = new StepModel(step)
                        sm.setAsEdited();
                    });
                    
                    reloadCropsFromJson(content);

                    let codeSnippet = `{{Graphique Triple Performance \n| title=${content.title} \n| json=${self.systemID} \n| type=Rotation }}`;
                    $('#code-snippet').val(codeSnippet).on('focus', function() {
                        $(this).select();
                    });
                    $('#codeSnippetDiv').removeClass('d-none');
                    

                } catch (e) {
                    console.error("Erreur lors de l'analyse du JSON de la page :", e);
                    $('#jsonErrorMessage').text("Le contenu de la page n'est pas un JSON valide.");
                    const jsonErrorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
                    jsonErrorModal.show();
                }
            } else {
                wipe();
            }
        });
    
    }

    /**
     * Save a page back to the wiki. The page title must have been set previously.
     */
    async saveToItinera() {
        const self = this;

        if (!self.systemID) {
            // Error ?
            return;
        }
        
        // Proceed to save
        const response = await fetch(`/api/systems/${encodeURIComponent(self.systemID)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                json: crops
            })
        });

        if (response.ok) {
            // Successfully saved - show a toast
            const toast = $('#liveToast');

            // Update the time and message
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            toast.find('small').text(`${hours}:${minutes}`);
            toast.find('.toast-body').text('Sauvegardé dans Itinéra !');

            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
            toastBootstrap.show();
            
        } else {
            // Error saving
            const errorModal = new bootstrap.Modal(document.getElementById('saveErrorModal'));
            errorModal.show();
        }
    }

}
