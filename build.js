const fs = require('fs');
const path = require('path');

async function build() {
  let apps = [];

  // Fetch all projects from Vercel API
  const vercelToken = process.env.VERCEL_TOKEN;

  if (vercelToken) {
    try {
      console.log('Fetching projects from Vercel API...');

      // Fetch all projects (paginated)
      let allProjects = [];
      let url = 'https://api.vercel.com/v9/projects?limit=100';

      while (url) {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${vercelToken}` }
        });

        if (!response.ok) {
          throw new Error(`Vercel API error: ${response.status}`);
        }

        const data = await response.json();
        allProjects = allProjects.concat(data.projects || []);

        // Handle pagination
        url = data.pagination?.next ? `https://api.vercel.com/v9/projects?limit=100&until=${data.pagination.next}` : null;
      }

      console.log(`Found ${allProjects.length} Vercel projects`);

      // Convert to app entries
      for (const project of allProjects) {
        // Skip app-hub itself
        if (project.name === 'app-hub') continue;

        // Get the production domain
        let domain = null;

        // Check for custom domains first
        if (project.alias && project.alias.length > 0) {
          // Prefer custom domains over .vercel.app
          const customDomain = project.alias.find(a => !a.includes('vercel.app'));
          domain = customDomain || project.alias[0];
        }

        // Fallback to default vercel domain
        if (!domain) {
          domain = `${project.name}.vercel.app`;
        }

        // Format name from slug
        const name = project.name
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        apps.push({
          name,
          url: `https://${domain}`,
          slug: project.name,
          updatedAt: project.updatedAt
        });
      }

      // Sort by most recently updated
      apps.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      console.log(`Processed ${apps.length} apps for hub`);

    } catch (err) {
      console.error('Vercel API error:', err.message);
    }
  } else {
    console.log('No VERCEL_TOKEN - skipping API fetch');
  }

  // Read the HTML template
  const htmlPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Replace placeholder with actual apps
  html = html.replace(
    'const VERCEL_APPS = [];',
    `const VERCEL_APPS = ${JSON.stringify(apps, null, 2)};`
  );

  // Write to dist
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  fs.writeFileSync(path.join(distDir, 'index.html'), html);

  // Write manifest
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

  // Create simple SVG icon
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1a1a2e"/>
  <text x="50" y="65" font-size="50" text-anchor="middle" fill="#e94560">🚀</text>
</svg>`;

  fs.writeFileSync(path.join(distDir, 'icon.svg'), iconSvg);

  console.log(`Built app-hub with ${apps.length} apps`);
  console.log('Output: dist/');
}

build().catch(console.error);
