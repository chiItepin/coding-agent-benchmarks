# GitHub Pages Source

This directory contains the GitHub Pages site for the coding-agent-benchmarks project.

## Deployment

This site is automatically deployed via GitHub Pages using the `/docs` directory as the source.

## Files

- `index.html` - Main page showcasing benchmark results
- `styles.css` - Styling for the page
- `favicon.svg` - Site favicon
- `.nojekyll` - Prevents Jekyll processing (required for proper static asset serving)
- `assets/` - Additional assets (images, data files, etc.)

## Local Development

To preview locally, simply open `index.html` in a browser or use a local web server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## Updating

After making changes to files in this directory, commit and push to the main branch. GitHub Pages will automatically rebuild and deploy the site.
