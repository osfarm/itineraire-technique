// Encapsulate the wiki editor functionality
class WikiEditor {
    constructor() {
        // Initialize any properties if needed

        const self = this;

        // When the page loads, get the URL paremeter with the target page title we want to edit:
        window.onload = function () {
            const urlParams = new URLSearchParams(window.location.search);
            const pageTitle = urlParams.get('wiki');

            if (!pageTitle)
                return; // No page title provided, we are not in wiki edit mode

            // If a page title is provided, load its content
            fetch(`/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=wikitext`, {
                credentials: 'same-origin'
            })
                .then(response => {
                    let res = response.json();
                    return res;
                })
                .then(data => {
                    if (data.parse && data.parse.wikitext) {
                        try {
                            const content = JSON.parse(data.parse.wikitext['*']);
                            content.steps.forEach(step => {
                                let sm = new StepModel(step)
                                sm.setAsEdited();
                            });
                            reloadCropsFromJson(content);
                        } catch (e) {
                            console.error("Erreur lors de l'analyse du JSON de la page :", e);
                            $('#jsonErrorMessage').text("Le contenu de la page n'est pas un JSON valide.");
                            const jsonErrorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
                            jsonErrorModal.show();
                        }
                    } else {

                        if (data.error.code == "missingtitle") {
                            // The page doesn't exist yet, we can start with a blank rotation
                            wipe();
                        } else {
                            console.error("Erreur lors du chargement de la page :", data);
                            $('#jsonErrorMessage').text("Impossible de charger le contenu de la page.");
                            const jsonErrorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
                            jsonErrorModal.show();
                        }

                    }
                });

            // Add a button to save the page back the wiki
            const saveButton = $(`<button type="button" class="btn btn-outline-primary primary-button" id="exportToJsonButton">
                                    <i class="fa fa-download" aria-hidden="true"></i> Enregistrer dans le wiki
                                  </button>`).on('click', function () {
                if (pageTitle) {
                    // If a page title is provided, save to that page
                    self.savePageToWiki(pageTitle, JSON.stringify(crops, null, 2))
                        .then(() => {
                            alert("Itinéraire technique enregistré avec succès !");
                        })
                        .catch(err => {
                            console.error("Erreur lors de l'enregistrement de la page :", err);
                            alert("Une erreur s'est produite lors de l'enregistrement.");
                        });
                } else {
                    // Otherwise, export to JSON file
                    exportToJsonFile(crops);
                }
            });

            $(".file-icons").first().prepend(saveButton);

            $('#importFromExampleJsonButton').remove();
            $('#importFromJsonButton').remove();
        };
    }

    async savePageToWiki(pageTitle, newContent) {
        // 1. Obtenir un token
        const tokenResp = await fetch('/api.php?action=query&meta=tokens&type=csrf&format=json', {
            credentials: 'same-origin' // important pour envoyer les cookies de session
        });
        const tokenData = await tokenResp.json();
        const token = tokenData.query.tokens.csrftoken;

        // 2. Faire l’édition
        const params = new URLSearchParams();
        params.append('action', 'edit');
        params.append('format', 'json');
        params.append('title', pageTitle);
        params.append('text', newContent);
        params.append('token', token);
        params.append('contentmodel', 'json');

        const editResp = await fetch('/api.php', {
            method: 'POST',
            body: params,
            credentials: 'same-origin'
        });

        const editData = await editResp.json();
        console.log(editData);

        if (editData.edit && editData.edit.result === 'Success') { 
            return Promise.resolve();
        } else {
            return Promise.reject(editData);
        }
    }

}
