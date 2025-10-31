// Encapsulate the wiki editor functionality
class WikiEditor {
    constructor() {
        // Initialize any properties if needed
        this.pageTitle = null;
    }

    /**
     * When the page loads, get the URL paremeter with the target page title we want to edit:
     * @returns 
     */
    loadPageFromURL() {
        
        const self = this;

        const urlParams = new URLSearchParams(window.location.search);
        self.pageTitle = urlParams.get('wiki');

        if (!self.pageTitle)
            return; // No page title provided, we are not in wiki edit mode

        // If a page title is provided, load its content
        fetch(`/api.php?action=parse&page=${encodeURIComponent(self.pageTitle)}&format=json&prop=wikitext`, {
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
    
    }

    /**
     * Save a page back to the wiki. The page title must have been set previously.
     */
    async saveToWiki() {
        const self = this;

        if (!self.pageTitle) {
            alert("Aucun titre de page spécifié pour l'enregistrement.");
            return;
        }
        
        // If a page title is provided, save to that page
        self.savePageToWiki(self.pageTitle, JSON.stringify(crops, null, 2))
            .then(() => {

                // TODO : Also set a few semantic properties on the page, including the chart type, the geolocation, etc.


                alert("Itinéraire technique enregistré avec succès !");
            })
            .catch(err => {
                console.error("Erreur lors de l'enregistrement de la page :", err);
                alert("Une erreur s'est produite lors de l'enregistrement.");
            });
    }

    async savePageToWiki(pageTitle, newContent) {
        const self = this;

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

    async getWikiUserInfo() {
        try {
            const response = await fetch('/api.php?action=query&meta=userinfo&format=json', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.query.userinfo;
        } catch (error) {
            console.error("Error fetching wiki user info:", error);
            throw error;
        }
    }

    async getWikiUserFiles(username) {
        try {
            // Encode the username for the URL
            const encodedUsername = 'User:' + username;
            const query = encodeURIComponent(`[[Page author::${encodedUsername}]][[~*.json]]`);
            const url = `/api.php?action=ask&query=${query}|sort=Modification date|order=desc&format=json`;
            
            const response = await fetch(url, {
                credentials: 'include'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching wiki files:", error);
            throw error;
        }
    }

    async loadFromWiki() {
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('wikiFilesModal'));
        modal.show();
        
        // Reset the modal content
        $('#wikiFilesStatus').html('<i class="fa fa-spinner fa-spin"></i> Chargement de vos fichiers...');
        $('#wikiFilesList').empty();
        
        try {
            // Get user info
            const userInfo = await this.getWikiUserInfo();
            
            if (!userInfo.id || userInfo.id === 0) {
                $('#wikiFilesStatus').html('<div class="alert alert-warning">Vous devez être connecté au wiki pour utiliser cette fonctionnalité.</div>');
                return;
            }
            
            // Get user's JSON files
            const filesData = await this.getWikiUserFiles(userInfo.name);
            
            // Parse the results
            const results = filesData.query?.results;
            
            if (!results || Object.keys(results).length === 0) {
                $('#wikiFilesStatus').html('<div class="alert alert-info">Aucun fichier JSON trouvé dans vos pages.</div>');
                return;
            }
            
            // Display the files
            $('#wikiFilesStatus').html(`<p class="text-muted">Connecté en tant que <strong>${userInfo.name}</strong></p>`);
            
            const filesList = $('#wikiFilesList');
            
            for (const [pageTitle, pageData] of Object.entries(results)) {
                const displayTitle = pageData.displaytitle || pageTitle;
                const fullUrl = pageData.fullurl || '';
                
                // if displayTitle is a subpage (contains /), split in two spans:
                let [parent, child] = displayTitle.includes('/') ? displayTitle.split('/') : [displayTitle];

                // If one or the other is too long, truncate it:
                const truncate = (str, length) => {
                    if (str.length > length) {
                        return str.substring(0, length - 3) + '...';
                    }
                    return str;
                };

                parent = truncate(parent, 50);
                child = truncate(child, 70);

                const listItem = $(`
                    <a href="editor.html?wiki=${encodeURIComponent(pageTitle)}" class="list-group-item list-group-item-action wiki-file-item">
                        <div class="d-flex w-100 justify-content-between">
                            <p class="mb-1">${parent ? `<span class="badge text-bg-secondary">${parent}/</span>` : ''} ${child || ''}</p>
                            <small><i class="fa fa-external-link"></i></small>
                        </div>
                    </a>
                `);
   
                filesList.append(listItem);
            }
            
        } catch (error) {
            $('#wikiFilesStatus').html(`<div class="alert alert-danger">Erreur lors du chargement des fichiers: ${error.message}</div>`);
        }
    }

}
