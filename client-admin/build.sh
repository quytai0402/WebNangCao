#!/usr/bin/env bash
# Build script for render.com

# Exit on error
set -o errexit

npm run build

# Create a production-ready server to serve the React app with routing support
cat > build/render-server.js << 'EOJS'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Redirect all routes to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
EOJS

# Add Express to the build
echo '{"dependencies":{"express":"^4.18.2"}}' > build/package.json 