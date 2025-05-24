/**
 * Pin Collections Plugin Settings
 */

import './settings.css';

(function(window) {
  'use strict';
  
  const SettingsPage = {
    pinnedCollections: [],
    allCollections: [],
    displayOptions: {
      itemsPerRow: 6,
      showItemCount: true,
      showUnplayedBadge: true,
      sectionPosition: 0
    },
    
    // Initialize settings page
    init: function() {
      console.log('Initializing Pin Collections settings page');
      
      // Load saved collections and settings
      this.loadSettings()
        .then(() => {
          // Render the settings page
          this.renderSettings();
          
          // Add event listeners
          this.addEventListeners();
        });
    },
    
    // Load settings from server
    loadSettings: function() {
      return Promise.all([
        // Load pinned collections
        window.ApiClient.getUserData('pincollections', 'pinnedCollections')
          .then(data => {
            if (data) {
              this.pinnedCollections = JSON.parse(data);
            } else {
              this.pinnedCollections = [];
            }
          }),
        
        // Load display options
        window.ApiClient.getUserData('pincollections', 'displayOptions')
          .then(data => {
            if (data) {
              this.displayOptions = { ...this.displayOptions, ...JSON.parse(data) };
            }
          }),
        
        // Load all available collections
        this.loadAllCollections()
      ]);
    },
    
    // Load all collections from the server
    loadAllCollections: function() {
      return window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), {
        IncludeItemTypes: 'BoxSet',
        Recursive: true,
        Fields: 'BasicSyncInfo,ChildCount'
      }).then(result => {
        this.allCollections = result.Items.map(item => ({
          id: item.Id,
          name: item.Name,
          itemCount: item.ChildCount || 0,
          type: item.Type
        }));
      });
    },
    
    // Save settings to server
    saveSettings: function() {
      // Save pinned collections
      window.ApiClient.setUserData('pincollections', 'pinnedCollections', JSON.stringify(this.pinnedCollections))
        .catch(error => console.error('Error saving pinned collections:', error));
      
      // Save display options
      window.ApiClient.setUserData('pincollections', 'displayOptions', JSON.stringify(this.displayOptions))
        .catch(error => console.error('Error saving display options:', error));
      
      // Show success message
      this.showNotification('Settings saved');
      
      // Refresh home page
      window.Events.trigger('refreshhomesection');
    },
    
    // Render the settings page
    renderSettings: function() {
      const container = document.querySelector('#settingsContainer');
      if (!container) return;
      
      container.innerHTML = `
        <div class="settings-page">
          <h2>Pin Collections Settings</h2>
          
          <div class="settings-section">
            <h3>Display Options</h3>
            <div class="form-group">
              <label for="sectionPosition">Section Position on Home Screen</label>
              <select id="sectionPosition" class="form-control">
                <option value="0" ${this.displayOptions.sectionPosition === 0 ? 'selected' : ''}>Top</option>
                <option value="1" ${this.displayOptions.sectionPosition === 1 ? 'selected' : ''}>After "Continue Watching"</option>
                <option value="2" ${this.displayOptions.sectionPosition === 2 ? 'selected' : ''}>After "Next Up"</option>
                <option value="3" ${this.displayOptions.sectionPosition === 3 ? 'selected' : ''}>Bottom</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="itemsPerRow">Items Per Row (Desktop)</label>
              <select id="itemsPerRow" class="form-control">
                <option value="4" ${this.displayOptions.itemsPerRow === 4 ? 'selected' : ''}>4</option>
                <option value="5" ${this.displayOptions.itemsPerRow === 5 ? 'selected' : ''}>5</option>
                <option value="6" ${this.displayOptions.itemsPerRow === 6 ? 'selected' : ''}>6</option>
                <option value="7" ${this.displayOptions.itemsPerRow === 7 ? 'selected' : ''}>7</option>
                <option value="8" ${this.displayOptions.itemsPerRow === 8 ? 'selected' : ''}>8</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="showItemCount" ${this.displayOptions.showItemCount ? 'checked' : ''}>
                Show item count
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="showUnplayedBadge" ${this.displayOptions.showUnplayedBadge ? 'checked' : ''}>
                Show unplayed item badge
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Pinned Collections</h3>
            <div class="collections-container">
              ${this.renderPinnedCollections()}
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Available Collections</h3>
            <div class="form-group search-group">
              <input type="text" id="searchCollections" class="form-control" placeholder="Search collections...">
            </div>
            <div class="collections-container available-collections">
              ${this.renderAvailableCollections()}
            </div>
          </div>
          
          <div class="button-container">
            <button id="saveSettings" class="button-primary">Save Settings</button>
          </div>
        </div>
      `;
    },
    
    // Render pinned collections
    renderPinnedCollections: function() {
      if (this.pinnedCollections.length === 0) {
        return '<div class="empty-message">No pinned collections. Add some from the available collections below.</div>';
      }
      
      let html = '<div class="collections-grid pinned-grid" id="sortablePinned">';
      
      this.pinnedCollections.forEach(collection => {
        html += `
          <div class="collection-item" data-id="${collection.id}">
            <div class="collection-item-poster" style="background-image: url(${this.getImageUrl(collection.id)})"></div>
            <div class="collection-item-name">${collection.name}</div>
            <button class="unpin-button" data-id="${collection.id}">
              <span class="material-icons">close</span>
            </button>
          </div>
        `;
      });
      
      html += '</div>';
      return html;
    },
    
    // Render available collections
    renderAvailableCollections: function() {
      if (this.allCollections.length === 0) {
        return '<div class="empty-message">No collections found in your library.</div>';
      }
      
      // Filter out already pinned collections
      const availableCollections = this.allCollections.filter(
        collection => !this.pinnedCollections.some(pinned => pinned.id === collection.id)
      );
      
      if (availableCollections.length === 0) {
        return '<div class="empty-message">All collections are already pinned.</div>';
      }
      
      let html = '<div class="collections-grid">';
      
      availableCollections.forEach(collection => {
        html += `
          <div class="collection-item" data-id="${collection.id}">
            <div class="collection-item-poster" style="background-image: url(${this.getImageUrl(collection.id)})"></div>
            <div class="collection-item-name">${collection.name}</div>
            <button class="pin-button" data-id="${collection.id}" data-name="${collection.name}" data-count="${collection.itemCount}">
              <span class="material-icons">push_pin</span>
            </button>
          </div>
        `;
      });
      
      html += '</div>';
      return html;
    },
    
    // Add event listeners for the settings page
    addEventListeners: function() {
      // Save settings button
      const saveButton = document.getElementById('saveSettings');
      if (saveButton) {
        saveButton.addEventListener('click', () => this.saveSettingsFromForm());
      }
      
      // Pin buttons
      document.querySelectorAll('.pin-button').forEach(button => {
        button.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const name = e.currentTarget.dataset.name;
          const itemCount = parseInt(e.currentTarget.dataset.count, 10);
          
          this.pinCollection({
            id,
            name,
            itemCount,
            type: 'BoxSet'
          });
          
          this.renderSettings();
        });
      });
      
      // Unpin buttons
      document.querySelectorAll('.unpin-button').forEach(button => {
        button.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          this.unpinCollection(id);
          this.renderSettings();
        });
      });
      
      // Search field
      const searchField = document.getElementById('searchCollections');
      if (searchField) {
        searchField.addEventListener('input', (e) => this.filterCollections(e.target.value));
      }
      
      // Initialize sortable for pinned collections
      const sortableEl = document.getElementById('sortablePinned');
      if (sortableEl) {
        new SortableJS(sortableEl, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          onEnd: (evt) => {
            // Update collection order after drag
            const items = evt.to.children;
            const newOrder = [];
            
            for (let i = 0; i < items.length; i++) {
              const id = items[i].dataset.id;
              const collection = this.pinnedCollections.find(c => c.id === id);
              if (collection) {
                newOrder.push(collection);
              }
            }
            
            this.pinnedCollections = newOrder;
          }
        });
      }
    },
    
    // Filter collections by search term
    filterCollections: function(searchTerm) {
      const collections = document.querySelectorAll('.available-collections .collection-item');
      const term = searchTerm.toLowerCase();
      
      collections.forEach(item => {
        const name = item.querySelector('.collection-item-name').textContent.toLowerCase();
        if (name.includes(term)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    },
    
    // Save settings from form inputs
    saveSettingsFromForm: function() {
      // Update display options from form
      this.displayOptions.sectionPosition = parseInt(document.getElementById('sectionPosition').value, 10);
      this.displayOptions.itemsPerRow = parseInt(document.getElementById('itemsPerRow').value, 10);
      this.displayOptions.showItemCount = document.getElementById('showItemCount').checked;
      this.displayOptions.showUnplayedBadge = document.getElementById('showUnplayedBadge').checked;
      
      // Save all settings
      this.saveSettings();
    },
    
    // Pin a collection
    pinCollection: function(collection) {
      if (this.isCollectionPinned(collection.id)) return;
      
      // Add to pinned collections
      this.pinnedCollections.push(collection);
      this.showNotification(`"${collection.name}" pinned to homescreen`);
    },
    
    // Unpin a collection
    unpinCollection: function(collectionId) {
      const index = this.pinnedCollections.findIndex(c => c.id === collectionId);
      if (index === -1) return;
      
      const name = this.pinnedCollections[index].name;
      
      // Remove from pinned collections
      this.pinnedCollections.splice(index, 1);
      this.showNotification(`"${name}" unpinned from homescreen`);
    },
    
    // Check if a collection is pinned
    isCollectionPinned: function(collectionId) {
      return this.pinnedCollections.some(c => c.id === collectionId);
    },
    
    // Get image URL for a collection
    getImageUrl: function(collectionId) {
      return window.ApiClient.getImageUrl(collectionId, {
        type: 'Primary',
        maxHeight: 200
      });
    },
    
    // Show notification
    showNotification: function(message) {
      window.Dashboard.showToast({
        message: message,
        timeout: 2000
      });
    }
  };
  
  // Initialize settings page when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    SettingsPage.init();
  });
  
  // Export for debugging
  window.PinCollectionsSettings = SettingsPage;
  
})(window);