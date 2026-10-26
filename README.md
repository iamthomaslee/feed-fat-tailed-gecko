# Feed the Fat-Tailed Gecko 🦎 (팻테일게코 벌레잡기)

A small browser game where you steer a fat-tailed gecko around a terrarium and eat as many bugs as you can in 60 seconds. The gecko grows a little bigger with every bug it eats.

**Play it:** https://iamthomaslee.github.io/feed-fat-tailed-gecko/

## How to play

- Move the gecko with the **arrow keys**. You can hold two at once to move diagonally.
- A bug is eaten when it touches the gecko's **head**.
- Each bug gives the gecko energy. Bugs worth more energy move faster.
- A round lasts **60 seconds**. Your score is the total energy, and your best score is saved in the browser.
- Press **Space** or **Enter** (or click the button) to start or play again.

| Bug | Energy | Speed (px/s) |
|---|---|---|
| Ant (개미) | 1 | 60 |
| Spider (거미) | 1 | 60 |
| Mealworm (밀웜) | 2 | 90 |
| Silkworm larva (누에 애벌레) | 2 | 90 |
| Cricket (귀뚜라미) | 3 | 120 |
| Fly (파리) | 5 | 180 |

The gecko moves at 220 px/s and grows 1.5% per energy point, up to 2.2× its starting size. A bigger gecko has a bigger head, so it catches bugs more easily.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Project structure

| Path | Purpose |
|---|---|
| `components/Game.tsx` | Game loop, keyboard input, HUD, gecko growth |
| `components/bugs.ts` | Bug types, energy points, speeds, spawn weights |
| `components/draw.ts` | Canvas drawings of the gecko and each bug |
| `components/Game.module.css` | Game styles |
| `app/` | Next.js App Router page and layout |

All graphics are drawn in code on an HTML5 canvas, so the game has no image files. To tune the game, edit the numbers in `components/bugs.ts` or the constants at the top of `components/Game.tsx` (`ROUND_SECONDS`, `GECKO_SPEED`, `GROWTH_PER_POINT`, `MAX_SCALE`, and others).

## Deployment

The site is built as a static export (`output: "export"` in `next.config.ts`) and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

For this to work, the repository's **Settings → Pages → Source** must be set to **GitHub Actions**. The workflow sets the URL sub-path from the repository name automatically.

## Built with

[Next.js](https://nextjs.org), React, TypeScript, and the HTML5 Canvas API.
