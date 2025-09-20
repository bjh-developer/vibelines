# Vercel Deployment Checklist for Spotify OAuth

## 📋 Pre-Deployment Steps

### 1. Get Required API Keys

#### Spotify Client Secret:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Show Client Secret"
4. Copy the secret (keep it secure!)

#### NocodeAPI Key:
1. Sign up at [NocodeAPI](https://nocodeapi.com/)
2. Create a new Spotify integration
3. Copy your API key

#### JWT Secret:
Generate a secure random string (32+ characters). You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update Spotify App Settings
In your Spotify Developer Dashboard, add these Redirect URIs:

**⚠️ IMPORTANT: Add ALL these URIs for different environments:**
- `http://localhost:3000/api/spotify-oauth?action=callback` (for development)  
- `https://vibelines.vercel.app/api/spotify-oauth?action=callback` (for production)
- `https://vibelines-git-nocodeapi-workaround-bjh-developers-projects.vercel.app/api/spotify-oauth?action=callback` (for your current preview)

**💡 TIP:** For preview deployments, you'll need to add each preview URL. Vercel preview URLs follow this pattern:
- `https://your-repo-name-git-branch-name-your-username.vercel.app/api/spotify-oauth?action=callback`

**❌ DO NOT USE these URIs (they will cause "Missing code or state parameter" errors):**
- `https://vibelines.vercel.app/callback`
- `http://localhost:3000/callback`

## 🚀 Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

### Required for Production:
```
VITE_SPOTIFY_CLIENT_ID = bfdf4d48857a4b629a803511e2c4752e
SPOTIFY_CLIENT_SECRET = [your_spotify_client_secret]
NOCODE_API_KEY = [your_nocode_api_key]
JWT_SECRET = [your_generated_jwt_secret]
FRONTEND_URL = https://vibelines.vercel.app
VITE_BACKEND_URL = https://vibelines.vercel.app
```

### Required for Preview Deployment:
```
FRONTEND_URL = https://vibelines-git-nocodeapi-workaround-bjh-developers-projects.vercel.app
VITE_BACKEND_URL = https://vibelines-git-nocodeapi-workaround-bjh-developers-projects.vercel.app
```

**💡 Note:** The code will default to your preview URL if no `FRONTEND_URL` is set.

### Existing Variables (copy from your current .env):
```
VITE_SUPABASE_URL = https://ahivacdbsfhxuoijufyv.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENROUTER_API_KEY = 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
M2E_API_KEY = rMuW2Ka&s&8d53rvwYcocOj2tzuqsl
```

## ⚙️ Environment Targets

For each variable, set the target environments:
- ✅ Production
- ✅ Preview (recommended)
- ✅ Development (optional, you have local .env)

## 🔍 Testing After Deployment

1. Deploy to Vercel
2. **First, test the API endpoint directly:**
   - Go to `https://vibelines.vercel.app/api/spotify-oauth?action=login`
   - Should redirect to Spotify login (not show 404)
3. Test the full OAuth flow:
   - Click "Connect Spotify" in your app
   - Should redirect to Spotify login
   - After login, should redirect back to your app
   - Should see user's liked songs loading

## 🏠 Local Development Notes

**Important:** The serverless function (`/api/spotify-oauth`) will NOT work with `npm run dev` because Vite doesn't execute serverless functions.

### For Local Testing:
1. **Test on Vercel Preview**: Push your code and test on the preview deployment
2. **Use Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   vercel dev
   ```
   This runs a local Vercel environment that supports serverless functions.

### Local Development Workaround:
For local development, you can temporarily modify your frontend to use direct Spotify OAuth (without the backend) by updating the `initiateSpotifyAuth` function to use the old direct approach.

## 🐛 Troubleshooting

### If you see "No routes matched location /api/spotify-oauth":
1. Check that `vercel.json` has the correct rewrite rules
2. Ensure API routes are excluded from SPA rewrites
3. Verify the `spotify-oauth.js` file exists in `/api/` folder
4. Check Vercel Functions tab in dashboard

### If you get "500: INTERNAL_SERVER_ERROR" or "FUNCTION_INVOCATION_FAILED":
1. Check Vercel Function logs:
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Click on the failed function to see logs
2. Verify all environment variables are set correctly
3. Check that all required dependencies are installed
4. Test the function endpoint directly first before testing the full flow

### If you get "require is not defined in ES module scope":
1. Ensure your serverless function uses ES module syntax (import/export)
2. Check that your package.json has `"type": "module"`
3. Use `import` statements instead of `require()`
4. Use `export default` instead of `module.exports`

### If you get "Missing code or state parameter" error:
1. **Check Spotify Redirect URIs**: Ensure you're using `/api/spotify-oauth?action=callback` NOT `/callback`
2. **Remove old redirect URIs**: Delete any `/callback` URIs from Spotify Developer Dashboard
3. **Check browser network tab**: Verify which redirect_uri is being sent to Spotify
4. **Check Vercel function logs**: See if the callback is reaching your serverless function

### If you see source code instead of function execution locally:
1. This is expected behavior with `npm run dev` (Vite doesn't run serverless functions)
2. Test on Vercel preview deployment instead
3. Or use `vercel dev` for local serverless function testing

### If you get "Function Runtimes must have a valid version" error:
1. Remove explicit runtime configuration from `vercel.json`
2. Let Vercel auto-detect Node.js functions
3. Ensure your `vercel.json` only has the rewrite rules

## 🚨 Security Notes

- Never commit `.env` files to git
- Use strong JWT secrets (32+ characters)
- Keep your Spotify Client Secret secure
- NocodeAPI keys should also be kept secret

## 🐛 Troubleshooting

### If OAuth fails:
1. Check Vercel logs for errors
2. Verify all environment variables are set
3. Ensure Spotify redirect URIs match exactly
4. Check that SPOTIFY_CLIENT_SECRET is correct

### If NocodeAPI fails:
1. Verify NOCODE_API_KEY is correct
2. Check your NocodeAPI dashboard for usage limits
3. Ensure your NocodeAPI Spotify integration is properly configured
