# JNV Campus Puzzle

## GitHub Pages

When the site is opened from GitHub Pages, it requests the current file list
from the public GitHub repository
`sharepickiran-gif/JNV_puzzle/images`. Newly added supported images (`.png`,
`.jpg`, `.jpeg`, `.gif`, `.webp`, or `.bmp`) are available after they have been
committed and pushed; reload the page to load the updated list.

In the repository settings, select **Settings > Pages > Build and deployment >
GitHub Actions**. Push changes to `main` or `master` to deploy the site.

## Run locally

The local server discovers images directly from the folder. From this folder,
run:

```powershell
python server.py
```

Then open <http://127.0.0.1:8000> in your browser. The local server reads the
current contents of `images/` when the page loads.

Press Ctrl+C in the terminal to stop the server.
