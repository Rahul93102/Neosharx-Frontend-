# NeoSharX Frontend - Production Setup

## For Production Deployment

The current setup uses Tailwind CSS CDN for development. For production, follow these steps:

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Build CSS for Production

```bash
npm run build-css-prod
# or
yarn build-css-prod
```

### 3. Update HTML Files

Replace the CDN script tag:

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```

With the compiled CSS link:

```html
<link href="./dist/output.css" rel="stylesheet" />
```

### 4. Development with Watch Mode

```bash
npm run build-css
# or
yarn build-css
```

## File Structure

- `package.json` - Dependencies and build scripts
- `tailwind.config.js` - Tailwind configuration
- `src/input.css` - Source CSS with Tailwind directives
- `dist/output.css` - Compiled CSS (generated)

## Benefits of Production Setup

- Faster loading (no CDN dependency)
- Smaller bundle size with purging
- Better performance
- No external dependencies for styling
