// Initialize the first tab as active on page load
document.addEventListener('DOMContentLoaded', function() {
    openTab('properties', {currentTarget: document.querySelector('[data-tab="properties"]')});
});

// Opens Different Admin Panel Tabs
function openTab(tabName, event) {
    // Prevent default behavior if event is provided
    if (event) {
        event.preventDefault();
    }
    
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // Show the selected tab content and mark button as active
    document.getElementById(tabName).classList.add('active');
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// DELETE PROPERTIES
function deleteProperty(id) {
    if (confirm("Are you sure you want to delete this property?")) {
        fetch('../assets/php/sql_delete_property.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'id=' + encodeURIComponent(id)
        })
        .then(response => response.text())
        .then(data => {
            alert(data); // Optional feedback
            location.reload(); // Refresh page to reflect changes
        })
        .catch(error => console.error("Error:", error));
    }
}

// EDIT PROPERTIES        
function editProperty(id) {
    // Show loading state
    document.getElementById('editPropertyContent').innerHTML = '<p>Loading...</p>';
    
    // Add modal-open class to body
    document.body.classList.add('modal-open');
    
    // Show modal
    document.getElementById('editPropertyModal').style.display = 'block';
    
    // Load edit form via AJAX
    fetch('edit_property.php?id=' + id)
        .then(response => response.text())
        .then(data => {
            document.getElementById('editPropertyContent').innerHTML = data;
        })
        .catch(error => {
            document.getElementById('editPropertyContent').innerHTML = 
                '<div class="alert alert-error">Error loading form: ' + error + '</div>';
        });
}

// ADD PROPERTIES
function addProperty(){
    const form = document.querySelector('.add-property-form');
    const formData = new FormData(form);

    fetch('../../views/sql_add_property.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        form.reset();
        openTab('properties'); //return to properties tab
    })
    .catch(error => {
        console.error("Error: ", error);
    })
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.classList.remove('modal-open');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.classList.remove('modal-open');
}
        
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}