const fs = require('fs');
const path = require('path');

// Read the Code63 app registry
const registryPath = path.join(__dirname, '..', 'code63-app', 'src', 'lib', 'app-registry.ts');
let code63Apps = [];

try {
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  // Extract all quoted strings that look like app slugs (lowercase with dashes)
  const slugPattern = /'([a-z0-9-]+)'/g;
  let match;
  const inArray = registryContent.includes('REGISTERED_APPS');

  // Find the array start
  const arrayStart = registryContent.indexOf('REGISTERED_APPS: string[] = [');
  if (arrayStart !== -1) {
    const arraySection = registryContent.slice(arrayStart);
    const arrayEnd = arraySection.indexOf('];');
    const arrayContent = arraySection.slice(0, arrayEnd);

    while ((match = slugPattern.exec(arrayContent)) !== null) {
      code63Apps.push(match[1]);
    }
  }
  console.log(`Found ${code63Apps.length} Code63 apps`);
} catch (err) {
  console.log('Could not read Code63 registry:', err.message);
}

// Read the HTML template
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Replace placeholder with actual apps
html = html.replace(
  'const CODE63_APPS = REGISTERED_APPS_PLACEHOLDER;',
  `const CODE63_APPS = ${JSON.stringify(code63Apps)};`
);

// Write to dist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// Copy manifest
const manifest = {
  name: "My Apps",
  short_name: "My Apps",
  description: "Quick access to all my apps",
  start_url: "/",
  display: "standalone",
  background_color: "#1a1a2e",
  theme_color: "#1a1a2e",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
  ]
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Create simple SVG icons
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1a1a2e"/>
  <text x="50" y="65" font-size="50" text-anchor="middle" fill="#e94560">🚀</text>
</svg>`;

fs.writeFileSync(path.join(distDir, 'icon.svg'), iconSvg);

console.log(`Built app-hub with ${code63Apps.length} Code63 apps + standalone apps`);
console.log('Output: dist/');
