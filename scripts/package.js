const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create a new zip file
const zip = new AdmZip();

// Add the built files from dist
const distFiles = ['plugin.js', 'settings.js'];
distFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '../dist', file))) {
    zip.addLocalFile(path.join(__dirname, '../dist', file));
  }
});

// Add the plugin.json
zip.addLocalFile(path.join(__dirname, '../plugin.json'));

// Add the pages directory
const pagesDir = path.join(__dirname, '../pages');
if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir);
  pages.forEach(page => {
    zip.addLocalFile(path.join(pagesDir, page), 'pages');
  });
}

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Write the zip file
const zipPath = path.join(distDir, 'jellyfin-pin-collections.zip');
zip.writeZip(zipPath);

// Calculate and display checksum
const fileBuffer = fs.readFileSync(zipPath);
const hashSum = crypto.createHash('sha256');
hashSum.update(fileBuffer);
const hex = hashSum.digest('hex');

console.log('Plugin package created at dist/jellyfin-pin-collections.zip');
console.log('SHA256 Checksum:', hex);