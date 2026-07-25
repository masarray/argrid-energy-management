# Contributing to ArGrid

Thank you for helping improve ArGrid.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Run `npm run dev` while developing.
4. Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Product principles

Contributions should preserve these principles:

- Calm normal states and obvious abnormal states
- Dense but organized industrial information
- No decorative animation that reduces operational clarity
- Financial impact connected to technical findings
- Data quality and simulation status remain visible
- No implication that simulated controls operate real equipment
- Accessibility and reduced-motion behavior are maintained

## Code style

- Use TypeScript and functional React components.
- Keep domain behavior outside presentational components when practical.
- Prefer small reusable components over duplicated layout code.
- Avoid direct DOM manipulation unless required by a visualization.
- Use semantic color tokens from `src/styles.css`.
- Do not hard-code deployment paths; GitHub Pages uses relative assets and hash routing.

## Licensing

By submitting a contribution, you agree that it is licensed under GPL-3.0-only with the rest of the project.
