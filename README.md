# Colby Website

Product website for [Colby](https://github.com/GetColby).

## Hosting with Cloudflare Pages

### Option 1: Connect via Git (Recommended)

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and select **Workers & Pages** from the sidebar.
2. Click **Create** > **Pages** > **Connect to Git**.
3. Select the **GetColby/colby-website** repository and click **Begin setup**.
4. Configure the build settings:
   - **Project name**: `colby-website` (this becomes `colby-website.pages.dev`)
   - **Production branch**: `main`
   - **Framework preset**: None
   - **Build command**: *(leave blank — this is a static site, no build step needed)*
   - **Build output directory**: `/` *(root of the repo)*
5. Click **Save and Deploy**.

Every push to `main` will automatically trigger a new deployment.

### Option 2: Direct Upload

If you prefer not to connect Git:

1. Go to **Workers & Pages** > **Create** > **Pages** > **Upload assets**.
2. Name your project `colby-website`.
3. Drag and drop the repo contents (excluding `Screenshots/`) into the upload area.
4. Click **Deploy site**.

> Note: Direct uploads don't auto-deploy on git push. You'll need to re-upload manually or use the Wrangler CLI for subsequent deploys.

### Custom Domain

After deployment:

1. Go to your Pages project > **Custom domains**.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g., `colby.app` or `www.colby.app`).
4. If your domain's DNS is already on Cloudflare, the CNAME record is added automatically.
5. If your DNS is elsewhere, add a CNAME record pointing to `colby-website.pages.dev` at your DNS provider, then click **Verify**.

### Preview Deployments

Every pull request automatically gets a unique preview URL (e.g., `abc123.colby-website.pages.dev`) so you can review changes before merging to `main`.
