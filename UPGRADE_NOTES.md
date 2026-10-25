# SecureTrack upgrade notes

This revision prioritizes a genuinely redesigned public website and a concrete full-platform delivery plan. The new homepage has a premium dark visual system, blue accents, an illustrative workspace preview, platform feature grid, operating workflow, signup CTA, and responsive behavior.

See `docs/FULL-WEBSITE-UPGRADE-PLAN.md` for the implementation roadmap and acceptance criteria. Planned items are intentionally separated from implemented items.

## Local development

1. Install a supported Node.js LTS version.
2. Run `npm run install:all` from the project root.
3. Configure backend environment variables from `backend/.env.example`.
4. Run `npm run dev`.

The frontend production build could not be verified in the current environment because dependency installation timed out. Run `npm run build` after dependencies are installed successfully.
