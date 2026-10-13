# K-Egg Maybunga website (sample)

## Files
- `index.html` - page structure and text
- `css/styles.css` - all styles (colors are at the top as CSS variables)
- `js/main.js` - menu rendering, order cart, mobile menu, scroll animation
- `data/menu.json` - menu items, prices, drink sizes, add-ons (edit prices here)
- `assets/images/` - logo, hero and order-section backgrounds, `food/` and `drinks/` photos

## Run it
The menu loads from `data/menu.json`, so open the site through a local server:
- VS Code: install "Live Server", right-click `index.html`, then "Open with Live Server"
- or run `npx serve` in this folder

Opening `index.html` by double-clicking will show "The menu could not load".

## Still to do before going live
- Replace the [BRACKETED] placeholders in `index.html` (opening hours, contact, pickup/delivery, owner's story)
- Set `ORDER_ENDPOINT` in `js/main.js` to a Google Apps Script web app URL to save pre-orders to a Google Sheet (until then the form is a demo)
- Confirm the Tiramisu Cold Coffee prices and the featured item with the owner
