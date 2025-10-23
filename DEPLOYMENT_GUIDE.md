# NeoSharX Frontend - Deployment & Troubleshooting Guide

## Issues Fixed

### 1. ✅ Tailwind CSS Error

**Problem**: `Uncaught ReferenceError: tailwind is not defined`

**Solution**:

- Removed the inline `tailwind.config` script block that was trying to configure Tailwind before it was loaded
- Now using pre-built CSS from `dist/output.css` which includes all Tailwind configuration
- CSS is built during `npm run build` using the `tailwind.config.js` file

### 2. ✅ CSS File Not Loading

**Problem**: `Failed to load resource: output.css 404`

**Solution**:

- Updated CSS path in `index.html` from `./dist/output.css` to `/dist/output.css`
- Added proper cache headers in `vercel.json`
- Built CSS file is now properly generated in `dist/` folder

### 3. ✅ Navigation and Auth Files Missing

**Problem**:

- `Failed to load resource: /navigation.html 404`
- `Failed to load resource: /global-auth.js 404`

**Solution**:

- Updated fetch paths to use absolute paths (`/navigation.html`, `/global-auth.js`)
- Added files to `build-files.json` for proper copying during build
- Files are copied to `dist/` folder during production build

### 4. ✅ CORS Errors

**Problem**: `Access to fetch has been blocked by CORS policy`

**Solution**:

- Added proper CORS handling in fetch requests with `mode: 'cors'` and appropriate headers
- Backend must have CORS headers enabled (Access-Control-Allow-Origin)
- Added error handling to gracefully handle CORS failures
- Events and videos will show loading state if backend is unreachable

## Build & Deployment Process

### Local Development

```bash
# Install dependencies
npm install

# Start development server (auto-builds CSS)
npm run dev

# Or manually build CSS and start server
npm run build-css  # Watch mode
npm start          # In another terminal
```

### Production Deployment

```bash
# Build everything (CSS minification + file copying)
npm run build

# This creates a dist/ folder with:
# - output.css (minified Tailwind)
# - index.html
# - All assets, navigation, auth files
# - All necessary static files
```

### Deploy to Vercel

#### Option 1: Using Vercel Dashboard

1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Configure:
   - **Framework**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click Deploy

#### Option 2: Using Vercel CLI

```bash
npm install -g vercel
cd frontend
vercel
```

## File Structure After Build

```
dist/
├── index.html              # Main page
├── output.css              # All Tailwind styles (minified)
├── navigation.html         # Navigation component
├── global-auth.js          # Auth script
├── assets/                 # Images
│   ├── Community.png
│   ├── events.png
│   ├── Startups.png
│   └── ...other images
├── auth/                   # Auth related files
└── ...other copied files
```

## Testing Locally

### With Python HTTP Server

```bash
cd frontend/dist
python3 -m http.server 8000
# Visit http://localhost:8000
```

### With npm

```bash
npm start
# Starts server at http://localhost:8000
```

## Troubleshooting Checklist

### CSS Not Loading

- [ ] Run `npm run build` to generate CSS
- [ ] Check if `dist/output.css` exists
- [ ] Verify CSS path in HTML is `/dist/output.css`
- [ ] Check browser DevTools > Network > output.css

### Navigation/Auth Files Missing

- [ ] Run `npm run build` to copy files
- [ ] Verify files exist in root directory: `navigation.html`, `global-auth.js`
- [ ] Check that paths in HTML use absolute paths: `/navigation.html`, `/global-auth.js`

### CORS Errors

- [ ] Backend URL must be correct in JavaScript: `https://neosharx-backend-1.onrender.com/api/auth`
- [ ] Backend must have CORS headers enabled
- [ ] Check browser console for specific CORS error details
- [ ] Events/videos gracefully degrade if backend is down

### Images Not Loading

- [ ] Run `npm run build` to copy assets
- [ ] Verify `assets/` folder is in repository
- [ ] Check that asset paths use `/assets/filename.png`

### Deployment Failures

#### If Vercel build fails:

1. Check Vercel build logs
2. Ensure all node_modules dependencies are in `package.json`
3. Run `npm run build` locally to test
4. Verify no build errors

#### If deployed site doesn't load:

1. Check Vercel function logs
2. Verify output directory is `dist`
3. Ensure all static files are in dist/
4. Clear Vercel cache and redeploy

## API Integration

### Backend Expected Endpoints

1. **Events by Type**

   - URL: `https://neosharx-backend-1.onrender.com/api/auth/events/type/past/`
   - URL: `https://neosharx-backend-1.onrender.com/api/auth/events/type/recent/`
   - URL: `https://neosharx-backend-1.onrender.com/api/auth/events/type/upcoming/`
   - Method: GET
   - Response: `{ results: [...] }`

2. **YouTube Videos**
   - URL: `https://neosharx-backend-1.onrender.com/api/auth/youtube-videos/`
   - Method: GET
   - Response: `{ videos: [...] }`

### CORS Requirements

Backend must return these headers:

```
Access-Control-Allow-Origin: https://frontend-neosharx.vercel.app
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Performance Notes

- CSS is minified in production (~72KB)
- All assets should be in `assets/` folder
- Images should be optimized before adding
- Consider using Vercel Image Optimization for `<img>` tags

## Maintenance

### Updating CSS

1. Modify Tailwind classes in HTML
2. Run `npm run build-css-prod`
3. Commit and push changes

### Adding New Assets

1. Add files to `assets/` folder
2. Update `build-files.json` if needed
3. Reference with path `/assets/filename`
4. Run `npm run build`

### Adding New Dependencies

1. Run `npm install package-name`
2. Use in your HTML/CSS
3. Test locally with `npm run build`
4. Commit and push

## Support

For issues:

1. Check this troubleshooting guide
2. Review browser DevTools console
3. Check Vercel deployment logs
4. Verify backend is running and accessible
