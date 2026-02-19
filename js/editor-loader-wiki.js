// Encapsulate the wiki editor functionality
class WikiLoader extends DefaultLoader {
    constructor(tikaeditorInstance = null) {
        super(tikaeditorInstance);

        // Initialize any properties if needed
        this.pageTitle = null;
    }

    /**
     * Setup the Wiki buttons dynamically in the toolbar
     */
    setupButtons() {
        const self = this;
        const container = '#toolbar-buttons-container';
        
        // Create the WikiButtons div structure
        const wikiButtonsDiv = $(`
            <div id="WikiButtons" class="">
                <div class="btn-group me-2" role="group">
                    <button type="button" class="btn btn-outline-primary primary-button btn-load-wiki">
                        <i class="fa fa-upload" aria-hidden="true"></i> Charger une rotation
                    </button>
                    <button type="button" class="btn btn-outline-primary primary-button dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="visually-hidden">Autres options de chargement</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item btn-import-test" href="#"><i class="fa fa-lightbulb-o" aria-hidden="true"></i> Charger un exemple</a></li>
                        <li><a class="dropdown-item btn-import-json" href="#"><i class="fa fa-upload" aria-hidden="true"></i> Importer (JSON)</a></li>
                    </ul>
                </div>
                <div class="btn-group me-2" role="group">
                    <button type="button" class="btn btn-outline-primary primary-button btn-save-wiki">
                        <i class="fa fa-download" aria-hidden="true"></i> Enregistrer dans le wiki
                    </button>
                    <button type="button" class="btn btn-outline-primary primary-button dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="visually-hidden">Autres options d'enregistrement</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item btn-save-as" href="#"><i class="fa fa-save" aria-hidden="true"></i> Enregistrer sous</a></li>
                        <li><a class="dropdown-item btn-export-json" href="#"><i class="fa fa-download" aria-hidden="true"></i> Exporter</a></li>
                    </ul>
                </div>
            </div>
        `);
        
        // Clear container and append the new buttons
        $(container).empty().append(wikiButtonsDiv);
        
        // Attach event handlers
        wikiButtonsDiv.find('.btn-load-wiki').on('click', function(e) {
            e.preventDefault();
            self.showConfirmationModal(() => {
                self.loadFromWiki();
            });
        });
        
        wikiButtonsDiv.find('.btn-save-wiki').on('click', function(e) {
            e.preventDefault();
            self.saveToWiki();
        });
        
        wikiButtonsDiv.find('.btn-save-as').on('click', function(e) {
            e.preventDefault();
            self.showSaveAsModal();
        });
        
        wikiButtonsDiv.find('.btn-import-test').on('click', function(e) {
            e.preventDefault();
            self.importFromTestJson();
        });
        
        wikiButtonsDiv.find('.btn-import-json').on('click', function(e) {
            e.preventDefault();
            self.importFromJsonFile();
        });
        
        wikiButtonsDiv.find('.btn-export-json').on('click', function(e) {
            e.preventDefault();
            self.doExportToJsonFile();
        });
        
        // Add wipe button
        this.addWipeButton();

        // Setup Save As modal event listeners
        $('#saveAsUseExistingPage').on('change', function() {
            $('#saveAsPageSelect').prop('disabled', !this.checked);
        });

        $('#saveAsConfirmBtn').off('click').on('click', function() {
            self.saveAs();
        });
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
                    self.tikaeditorInstance.reloadCropsFromJson(content);

                    let codeSnippet = `{{Graphique Triple Performance \n| title=${content.title} \n| json=${self.pageTitle} \n| type=Rotation }}`;
                    $('#code-snippet').val(codeSnippet).on('focus', function() {
                        $(this).select();
                    });

                    $('#codeSnippetDiv').show();

                } catch (e) {
                    console.error("Erreur lors de l'analyse du JSON de la page :", e);
                    $('#jsonErrorMessage').text("Le contenu de la page n'est pas un JSON valide.");
                    const jsonErrorModal = new bootstrap.Modal(document.getElementById('jsonErrorModal'));
                    jsonErrorModal.show();
                }
            } else {

                if (data.error.code == "missingtitle") {
                    // The page doesn't exist yet, we can start with a blank rotation
                    self.wipe();
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
            self.showSaveAsModal();
            return;
        }
        
        // If a page title is provided, save to that page
        self.savePageToWiki(self.pageTitle, JSON.stringify(self.tikaeditorInstance.system, null, 2))
            .then(async () => {
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


    async getWikiUserPages(username) {
        try {
            // Encode the username for the URL
            const encodedUsername = 'User:' + username;
            const query = encodeURIComponent(`[[Page author::${encodedUsername}]]`);
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

    /**
     * Show the Save As modal and handle the save as functionality
     */
    async showSaveAsModal() {
        const self = this;
        
        try {
            // Get user info to check if logged in
            const userInfo = await this.getWikiUserInfo();
            
            if (!userInfo.id || userInfo.id === 0) {
                alert('Vous devez être connecté au wiki pour utiliser cette fonctionnalité.');
                return;
            }

            // Get user's existing pages
            const pagesData = await this.getWikiUserPages(userInfo.name);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('saveAsModal'));
            modal.show();
            
            // Populate the select with user's pages
            const pageSelect = $('#saveAsPageSelect');
            pageSelect.empty();
            pageSelect.append('<option value="">Sélectionner une page...</option>');
            
            if (pagesData.query?.results) {
                for (const [pageTitle, pageData] of Object.entries(pagesData.query.results)) {
                    const displayTitle = pageData.displaytitle || pageTitle;
                    pageSelect.append(`<option value="${pageTitle}">${displayTitle}</option>`);
                }
            }
            
            // Set default filename from title if it's been changed
            const filenameInput = $('#saveAsFilename');
            const currentTitle = self.tikaeditorInstance.system.title || '';
            if (self.tikaeditorInstance.system.defaultTitle === false) {
                filenameInput.val(currentTitle);
            } else {
                filenameInput.val('');
            }
            
        } catch (error) {
            console.error("Error showing save as modal:", error);
            alert('Erreur lors du chargement des données utilisateur.');
        }
    }

    /**
     * Build the URL for saving based on the save as modal selections
     */
    buildSaveAsUrl() {
        const self = this;
        const useExistingPage = $('#saveAsUseExistingPage').prop('checked');
        const selectedPage = $('#saveAsPageSelect').val();
        const filename = $('#saveAsFilename').val().trim();
        
        if (!filename) {
            alert('Veuillez saisir un nom de fichier.');
            return null;
        }
        
        let subpageName;
        
        if (useExistingPage && selectedPage) {
            subpageName = selectedPage;
        } else {
            subpageName = 'Itinéraires techniques non classés';
        }
        
        // Build the final URL: subpagename/filename.json
        const finalUrl = `${subpageName}/${filename}.json`;

        if (self.tikaeditorInstance.system.defaultTitle !== false) {
            self.tikaeditorInstance.system.title = filename;
        }

        return finalUrl;
    }

    /**
     * Handle the save as operation
     */
    async saveAs() {
        const url = this.buildSaveAsUrl();
        
        if (!url) {
            return; // Error already handled in buildSaveAsUrl
        }
        
        const self = this;
        const oldPageTitle = self.pageTitle;

        try {
            // Set the new page title
            self.pageTitle = url;

            // Save to the wiki first
            await self.savePageToWiki(self.pageTitle, JSON.stringify(self.tikaeditorInstance.system, null, 2));
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('saveAsModal'));
            modal.hide();
            
            alert(`Itinéraire technique enregistré avec succès sous "${url}"`);
            
            // Only navigate after successful save
            const newEditorUrl = `editor.html?wiki=${encodeURIComponent(self.pageTitle)}`;
            window.location.href = newEditorUrl;
            
        } catch (error) {
            // Restore the old page title if save failed
            self.pageTitle = oldPageTitle;
            console.error("Error saving as new file:", error);
            alert('Erreur lors de l\'enregistrement du fichier.');
        }
    }
}
