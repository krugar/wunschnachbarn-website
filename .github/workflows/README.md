# GitHub Pages Deployment Setup

This directory contains the GitHub Actions workflow for deploying the Astro/SveltiaCMS site to GitHub Pages.

## Initial Setup Required

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**, make sure **Source** is set to **GitHub Actions**
4. The workflow will automatically handle the deployment

### 2. SveltiaCMS Authentication (Separate from deployment)

**Important:** The GitHub Actions deployment workflow does NOT require SveltiaCMS authentication. CI/CD builds and deploys static HTML which doesn't need access to the GitHub API.

For CMS users to edit content, they need to authenticate with GitHub separately through one of these methods:

#### Option A: Personal Access Token (Recommended for single-user/small team)
1. When users visit `/admin` on the deployed site
2. Click "Sign In with Token"
3. Click the provided link to generate a GitHub PAT with pre-selected scopes
4. Paste the token to authenticate
5. Token is stored in browser local storage

#### Option B: OAuth App (For multi-user/non-technical users)
Requires setting up a separate OAuth server. See:
- `docs/SveltiaCMS/github-backend.md` for full documentation
- Use [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-authenticator) for Cloudflare Workers deployment

## Deployment Workflow behavior

### Current Configuration: Tag-based releases
- **Trigger**: Push tags matching `v*` (e.g., `v1.0.0`)
- **Usage**:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

### Alternative: Main branch deployment
To deploy on every push to `main`, edit `.github/workflows/deploy.yml`:
1. Comment out the `tags` trigger
2. Uncomment the `branches: - main` section
3. See inline comments in the file

### Manual Deployment
You can also trigger a deployment manually:
1. Go to **Actions** tab on GitHub
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**

## Technical Details

- **Node.js version**: 22 (requires >=22.0.0)
- **Package manager**: pnpm
- **Deployment target**: `https://krugar.github.io/wunschnachbarn-website/`
- **Base path**: `/wunschnachbarn-website/` (configured in `astro.config.mjs`)
- **Build output**: `./dist/` directory
- **Deployment artifact**: Uploaded as GitHub Pages artifact

## Custom Domain Support

To use a custom domain instead of `krugar.github.io`:

1. **In `astro.config.mjs`**: Change `base: '/wunschnachbarn-website'` to `base: '/'`

2. **In your repository**: Create a `public/CNAME` file with:
   ```
   your-domain.com
   ```

3. **In DNS settings**: Configure your domain's DNS records as shown in GitHub Pages settings

## Troubleshooting

### Build fails with Node version error
- Ensure `package.json` `engines.node` matches the workflow's `node-version`
- Currently set to Node 22.x

### Links don't work after deployment
- Check that `astro.config.mjs` has the correct `base` path set
- For GitHub Pages: `base: '/wunschnachbarn-website'`
- For custom domain: `base: '/'`

### CMS route not accessible
- The CMS admin UI is at `/admin` relative to your base path
- Full URL: `https://krugar.github.io/wunschnachbarn-website/admin/`

### Workflow doesn't appear in Actions
- Ensure the workflow file is in `.github/workflows/` directory
- Commit and push the workflow file

## Security Notes

- **GitHub Actions permissions**: Automatically configured via `permissions` in the workflow
- **CMS authentication**: Separate from deployment, handled via browser-based PAT/OAuth
- **Commit verification**: Sveltia CMS automatically GPG-signs commits via GitHub's API
- **No secrets required for deployment**: The workflow uses GitHub's built-in `GITHUB_TOKEN`

## References

- [Astro deployment guide](https://docs.astro.build/en/guides/deploy/github-pages/)
- [SveltiaCMS GitHub backend](docs/SveltiaCMS/github-backend.md)
- [GitHub Actions permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
