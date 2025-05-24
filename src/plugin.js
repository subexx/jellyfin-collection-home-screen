/**
 * Pin Collections Plugin for Jellyfin
 * Allows users to pin collections to the homescreen
 */

import SortableJS from 'sortablejs';
import './styles.css';

// Plugin registration
(function(window) {
  'use strict';

  // Plugin namespace
  const PinCollections = {
    pinnedCollections: [],
    
    // Initialize the plugin
    init: function() {
      console.log('Initializing Pin Collections plugin');
      
      // Load saved pinned collections from server storage
      this.loadPinnedCollections();
      
      // Register page component for home screen
      this.registerHomePageComponent();
      
      // Add hooks for collection view
      this.addCollectionHooks();
      
      // Register settings page
      this.registerSettingsPage();
    },
    
    // Load pinned collections from server storage
    loadPinnedCollections: function() {
      window.ApiClient.getUserData('pincollections', 'pinnedCollections')
        .then(data => {
          if (data) {
            this.pinnedCollections = JSON.parse(data);
            console.log('Loaded pinned collections:', this.pinnedCollections);
          }
        })
        .catch(error => {
          console.error('Error loading pinned collections:', error);
          this.pinnedCollections = [];
        });
    },
    
    // Save pinned collections to server storage
    savePinnedCollections: function() {
      window.ApiClient.setUserData('pincollections', 'pinnedCollections', JSON.stringify(this.pinnedCollections))
        .catch(error => console.error('Error saving pinned collections:', error));
    },
    
    // Register home page component
    registerHomePageComponent: function() {
      window.Emby.Page.registerPageComponent('pinnedCollections', {
        name: 'Pinned Collections',
        type: 'homesection',
        order: 0,
        enableCache: false,
        renderCallback: (elem) => this.renderPinnedCollections(elem)
      });
    },
    
    // Render pinned collections section on home page
    renderPinnedCollections: function(element) {
      if (!this.pinnedCollections || this.pinnedCollections.length === 0) {
        element.innerHTML = '<div class="empty-message">No pinned collections. Add collections from the library.</div>';
        return;
      }
      
      // Create container for collections
      const container = document.createElement('div');
      container.className = 'pinned-collections-container';
      
      // Add section title
      const title = document.createElement('h2');
      title.className = 'section-title';
      title.textContent = 'Pinned Collections';
      container.appendChild(title);
      
      // Create sortable grid for collections
      const grid = document.createElement('div');
      grid.className = 'pinned-collections-grid';
      grid.id = 'sortable-collections';
      
      // Populate grid with collection cards
      this.pinnedCollections.forEach(collection => {
        const card = this.createCollectionCard(collection);
        grid.appendChild(card);
      });
      
      container.appendChild(grid);
      element.appendChild(container);
      
      // Initialize sortable functionality
      this.initSortable(grid);
    },
    
    // Create a collection card element
    createCollectionCard: function(collection) {
      const card = document.createElement('div');
      card.className = 'collection-card';
      card.dataset.id = collection.id;
      
      // Create poster image
      const poster = document.createElement('div');
      poster.className = 'collection-poster';
      poster.style.backgroundImage = `url(${this.getImageUrl(collection.id, 'Primary')})`;
      
      // Add badge if there are unplayed items
      if (collection.unplayedCount > 0) {
        const badge = document.createElement('div');
        badge.className = 'collection-badge';
        badge.textContent = collection.unplayedCount;
        poster.appendChild(badge);
      }
      
      // Create card content
      const content = document.createElement('div');
      content.className = 'collection-content';
      
      const name = document.createElement('div');
      name.className = 'collection-name';
      name.textContent = collection.name;
      
      const itemCount = document.createElement('div');
      itemCount.className = 'collection-item-count';
      itemCount.textContent = `${collection.itemCount} items`;
      
      content.appendChild(name);
      content.appendChild(itemCount);
      
      // Add unpin button
      const unpinButton = document.createElement('button');
      unpinButton.className = 'unpin-button';
      unpinButton.innerHTML = '<span class="material-icons">push_pin</span>';
      unpinButton.title = 'Unpin collection';
      unpinButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.unpinCollection(collection.id);
      };
      
      // Assemble card
      card.appendChild(poster);
      card.appendChild(content);
      card.appendChild(unpinButton);
      
      // Add click handler to navigate to collection
      card.onclick = () => {
        window.Emby.Page.show(`/collection/${collection.id}`);
      };
      
      return card;
    },
    
    // Initialize sortable functionality
    initSortable: function(element) {
      if (!element) return;
      
      const sortable = new SortableJS(element, {
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
          this.savePinnedCollections();
        }
      });
    },
    
    // Get image URL for a collection
    getImageUrl: function(collectionId, type) {
      return window.ApiClient.getImageUrl(collectionId, {
        type: type,
        maxHeight: 300
      });
    },
    
    // Add pin/unpin functionality to collection pages
    addCollectionHooks: function() {
      // Hook into collection detail page
      window.Emby.Page.on('pageshow', (type, view) => {
        if (type === 'collectiondetail') {
          this.enhanceCollectionPage(view);
        }
      });
    },
    
    // Enhance collection page with pin/unpin button
    enhanceCollectionPage: function(view) {
      // Get collection ID from URL
      const url = window.location.href;
      const matches = url.match(/\/collection\/([^\/]+)/);
      if (!matches || matches.length < 2) return;
      
      const collectionId = matches[1];
      
      // Find or create button container
      let buttonContainer = view.querySelector('.pin-button-container');
      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pin-button-container';
        
        // Find a good place to insert the button
        const detailsContainer = view.querySelector('.detailSection');
        if (detailsContainer) {
          detailsContainer.appendChild(buttonContainer);
        }
      }
      
      // Create pin/unpin button
      const isPinned = this.isCollectionPinned(collectionId);
      const pinButton = document.createElement('button');
      pinButton.className = `pin-button ${isPinned ? 'pinned' : ''}`;
      pinButton.innerHTML = `<span class="material-icons">${isPinned ? 'push_pin' : 'push_pin_outlined'}</span>`;
      pinButton.title = isPinned ? 'Unpin from home' : 'Pin to home';
      
      // Add click handler
      pinButton.onclick = () => {
        if (isPinned) {
          this.unpinCollection(collectionId);
        } else {
          this.pinCollection(collectionId, view);
        }
        
        // Update button state
        pinButton.classList.toggle('pinned');
        pinButton.innerHTML = `<span class="material-icons">${this.isCollectionPinned(collectionId) ? 'push_pin' : 'push_pin_outlined'}</span>`;
        pinButton.title = this.isCollectionPinned(collectionId) ? 'Unpin from home' : 'Pin to home';
      };
      
      // Add button to container
      buttonContainer.innerHTML = '';
      buttonContainer.appendChild(pinButton);
    },
    
    // Check if a collection is already pinned
    isCollectionPinned: function(collectionId) {
      return this.pinnedCollections.some(c => c.id === collectionId);
    },
    
    // Pin a collection to the homescreen
    pinCollection: function(collectionId, view) {
      if (this.isCollectionPinned(collectionId)) return;
      
      // Get collection details
      window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), collectionId)
        .then(collection => {
          const collectionData = {
            id: collection.Id,
            name: collection.Name,
            itemCount: collection.ChildCount || 0,
            unplayedCount: collection.UserData ? collection.UserData.UnplayedItemCount : 0,
            type: collection.Type
          };
          
          // Add to pinned collections
          this.pinnedCollections.push(collectionData);
          this.savePinnedCollections();
          
          // Show success message
          this.showNotification('Collection pinned to homescreen');
          
          // Refresh home page
          window.Events.trigger('refreshhomesection');
        })
        .catch(error => console.error('Error pinning collection:', error));
    },
    
    // Unpin a collection from the homescreen
    unpinCollection: function(collectionId) {
      const index = this.pinnedCollections.findIndex(c => c.id === collectionId);
      if (index === -1) return;
      
      // Remove from pinned collections
      this.pinnedCollections.splice(index, 1);
      this.savePinnedCollections();
      
      // Show success message
      this.showNotification('Collection unpinned from homescreen');
      
      // Refresh home page
      window.Events.trigger('refreshhomesection');
    },
    
    // Show notification
    showNotification: function(message) {
      window.Dashboard.showToast({
        message: message,
        timeout: 2000
      });
    },
    
    // Register settings page
    registerSettingsPage: function() {
      window.Dashboard.addPluginPage({
        name: 'Pin Collections',
        href: 'pinCollectionsSettings.html',
        icon: 'push_pin',
        type: 'settings',
        category: 'Display'
      });
    }
  };
  
  // Initialize the plugin when Jellyfin is ready
  window.Events.on('viewinit', function() {
    PinCollections.init();
  });
  
  // Export the plugin
  window.PinCollections = PinCollections;
  
})(window);