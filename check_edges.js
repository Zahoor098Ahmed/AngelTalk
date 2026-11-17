const fs = require('fs');

// Check which images in inspect_fd touch the outer edges
const files = fs.readdirSync('./inspect_fd');

// Let's use PowerShell System.Drawing script to inspect the edge pixels of all 77 files
