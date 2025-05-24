# Jellyfin Pin Collections Plugin

This plugin allows users to pin their favorite media collections to the Jellyfin homescreen for quick access.

## Features

- Pin and unpin collections to the homescreen with one click
- Drag and drop interface to reorder pinned collections
- Customizable display options (items per row, position on homescreen)
- Collection badges showing content count and unplayed items
- Settings page for managing pinned collections and display preferences
- Responsive design that works across all devices

## Installation

1. Download the latest release from the GitHub releases page
2. In your Jellyfin dashboard, go to Dashboard > Plugins
3. Click on "..." button and select "Upload Plugin"
4. Select the downloaded .zip file
5. Restart Jellyfin when prompted

## Usage

### Pinning Collections

1. Navigate to any collection in your Jellyfin library
2. Click the "Pin to home" button at the top of the collection page
3. The collection will immediately appear on your homescreen

### Managing Pinned Collections

1. Go to Dashboard > Plugins > Pin Collections
2. Here you can:
   - Reorder pinned collections by dragging and dropping
   - Remove collections from the pinned list
   - Add new collections to the pinned list
   - Adjust display settings

## Settings

The following settings are available:

- **Section Position**: Choose where the pinned collections section appears on your homescreen
- **Items Per Row**: Control how many collection cards appear in each row (on desktop)
- **Show Item Count**: Toggle the display of item counts on collection cards
- **Show Unplayed Badge**: Toggle the display of unplayed item badges

## Build from Source

If you want to build the plugin from source:

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. The built plugin will be in the `dist/` directory

## License

This plugin is released under the MIT license.

## Credits

Created with ❤️ for the Jellyfin community.