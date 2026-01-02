# Frontend Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Create `.env` file from `.env.example`
- [ ] Set `VITE_API_URL` to your production backend URL
  ```env
  VITE_API_URL=https://api.estaraht.com/api
  # or if backend is on same domain:
  VITE_API_URL=https://estaraht.com/api
  ```

### 2. Build the Application
```bash
npm install
npm run build
```

This will create a `build/` directory with:
- `build/client/` - Static assets
- `build/server/` - Server-side rendering files

### 3. Test the Build Locally
```bash
npm run preview
```

Visit `http://localhost:3000` to verify the build works correctly.

## Deployment Options

### Option 1: Static Hosting (Recommended for React Router SSR)

#### Using React Router Serve
```bash
npm start
```

#### Using Node.js Server
The `build/server/index.js` file can be used with any Node.js server:
- PM2 for process management
- Docker containers
- Traditional Node.js hosting

### Option 2: Static Export (SPA Mode)

If you want to deploy as a static site (without SSR):

1. Update `react-router.config.ts`:
```typescript
export default {
  ssr: false, // Disable SSR
} satisfies Config;
```

2. Build:
```bash
npm run build
```

3. Deploy the `build/client/` directory to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

### Option 3: Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Your production API URL

### Option 4: Docker Deployment

1. Build the Docker image:
```bash
docker build -t estraht-dashboard .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e VITE_API_URL=https://api.estaraht.com/api estraht-dashboard
```

### Option 5: Traditional VPS/Server

1. Transfer files to server:
```bash
scp -r build/ user@server:/var/www/estraht-dashboard/
```

2. Install dependencies on server:
```bash
cd /var/www/estraht-dashboard
npm install --production
```

3. Use PM2 to run:
```bash
pm2 start npm --name "estraht-dashboard" -- start
pm2 save
pm2 startup
```

4. Configure Nginx reverse proxy (if needed):
```nginx
server {
    listen 80;
    server_name dashboard.estaraht.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

### Production Environment Variables

Create a `.env.production` file or set in your hosting platform:

```env
VITE_API_URL=https://api.estaraht.com/api
```

**Important**: 
- Environment variables must be prefixed with `VITE_` to be accessible in the frontend
- Build-time variables are embedded in the build - rebuild after changing them
- Runtime environment variables are not available in Vite (use React Router's server-side capabilities if needed)

## Build Output

After running `npm run build`, you'll have:

```
build/
├── client/          # Static assets (HTML, CSS, JS)
│   ├── assets/      # Compiled JavaScript and CSS
│   └── *.html       # HTML files
└── server/          # Server-side code
    └── index.js     # Node.js server entry point
```

## Troubleshooting

### Build Fails
- Check Node.js version (should be >= 18)
- Clear `node_modules` and `build` folders, then reinstall:
  ```bash
  rm -rf node_modules build
  npm install
  npm run build
  ```

### API Connection Issues
- Verify `VITE_API_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible from frontend domain
- Check browser console for CORS errors

### 404 Errors on Routes
- Ensure server is configured to serve `index.html` for all routes
- Check React Router configuration
- Verify build completed successfully

### Performance Issues
- Enable production optimizations in build
- Check bundle size
- Verify assets are being cached properly
- Use CDN for static assets if possible

## Production Best Practices

1. **Security**
   - Never commit `.env` files
   - Use HTTPS in production
   - Set proper CORS headers on backend
   - Validate all API responses

2. **Performance**
   - Enable gzip/brotli compression
   - Use CDN for static assets
   - Implement caching strategies
   - Optimize images and assets

3. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor API response times
   - Track user analytics
   - Set up uptime monitoring

4. **Backup & Recovery**
   - Keep build artifacts backed up
   - Version control all configuration
   - Document deployment process
   - Have rollback procedure ready

## Support

For issues or questions, check:
- React Router docs: https://reactrouter.com
- Vite docs: https://vitejs.dev
- Project README.md

