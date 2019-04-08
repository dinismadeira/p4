/**
 * Modal Window Module
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const modal = {
    div: null,
    onClose: null,
    
    // Module initialization
    init: () => {
        
        // Create modal div
        modal.div = document.createElement('div');
        modal.div.setAttribute("class", "modal");
        const html = String.raw; // used for minification
        modal.div.innerHTML = html`
            <style>
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 6;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background-color: rgb(0,0,0);
                    background-color: rgba(0,0,0,0.4);
                }
                .modal-content {
                    background-color: #fefefe;
                    margin: 30px auto 0 auto;
                    padding: 20px;
                    border: 1px solid #888;
                    width: 1000px;
                }
                #modalCloseButton {
                    color: #aaa;
                    float: right;
                }
                #modalCloseButton:hover,
                #modalCloseButton:focus {
                    color: black;
                    text-decoration: none;
                    cursor: pointer;
                    background-color: rgb(255, 146, 106);
                }

            </style>
            <div class="modal-content"><button id="modalCloseButton" class="cornerButton">&times;</button><div id="modalInnerContent"></div></div>`;
        document.body.appendChild(modal.div);

        // Close modal when clicking the close button
        document.getElementById("modalCloseButton").addEventListener("click", modal.close);
        
        // Close modal when clicking the background
        modal.div.addEventListener("click", e => {
            if (e.target == modal.div) modal.close();
        });
    },
    
    // Opens a modal window
    open: content => {
        
        // Hide main window scroll bar
        document.body.style.overflow = 'hidden'; 
        
        // Populate modal window
        document.getElementById("modalInnerContent").innerHTML = content; 
        
        // Show modal window
        modal.div.style.display = "block"; 
    },
    
    // Closes current modal window
    close: () => {
        
        // Call onClose handler and only close if it returns true
        if (!modal.onClose || modal.onClose()) {
            
            // Hide modal window
            modal.div.style.display = "none";

            // Restore main window scroll bar
            document.body.style.overflow = '';
            
            // Clear modal window contents
            document.getElementById("modalInnerContent").innerHTML = '';
            
            // Remove onClose handler
            modal.onClose = false;
        }
    }
};

modal.init();