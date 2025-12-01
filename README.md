# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).


## Three.js component creation

1. Install Three.js Dependencies
  - Add three library for 3D rendering
  - Add @types/three for TypeScript support
  - Optional: three-stdlib for additional utilities like font loaders

2. Create 3D Text Component
  - Build a new Angular standalone component (ZipRip3DText.component.ts)
  - Set up canvas element for Three.js rendering
  - Initialize WebGL renderer with transparency support

3. Configure 3D Text Geometry
  - Load a 3D font (using FontLoader with JSON format fonts)
  - Create TextGeometry with depth, bevel, and curve settings
  - Position and center the text mesh in the scene

4. Add Textures & Materials
  - Apply MeshStandardMaterial or MeshPhysicalMaterial
  - Add texture maps: diffuse, normal, roughness, metallic
  - Configure material properties (metalness, roughness, emissive)

5. Set Up Lighting System
  - Ambient light for base illumination
  - Directional light for main light source
  - Point/spot lights for dramatic highlights
  - Optional: hemisphere light for realistic sky/ground lighting

6. Implement Floating Animation
  - Use Three.js animation loop (requestAnimationFrame)
  - Apply rotation and position transforms
  - Combine with GSAP for smooth easing effects
  - Add mouse interaction (optional parallax)

7. Integrate into Hero Component
  - Replace the current 2D text layers (lines 25-34)
  - Position 3D component with proper z-index
  - Ensure it works with existing GSAP animations
  - Use client:load directive for hydration

8. Optimize & Polish
  - Responsive canvas sizing for mobile/desktop
  - Performance: reduce geometry complexity on mobile
  - Dispose of Three.js resources in ngOnDestroy
  - Add loading state while fonts/textures load