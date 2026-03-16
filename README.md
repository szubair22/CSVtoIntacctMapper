# IntacctMapper — CSV Mapping Tool for Sage Intacct

Map any CSV to Sage Intacct's required format in seconds. 100% client-side — your data never leaves the browser.

**Live:** [szubair22.github.io/CSVtoIntacctMapper](https://szubair22.github.io/CSVtoIntacctMapper/)

## Features

- Drag-and-drop file upload for data CSV and Intacct template CSV
- Tabbed preview of both files before mapping
- Visual column mapping with auto-map (fuzzy matching)
- Decimal formatting option per column
- Proper CSV parsing (handles quoted fields, commas in values)
- One-click download of the mapped CSV
- Fully static — hosted on GitHub Pages, no backend required

## How to Use

1. Visit the [IntacctMapper](https://szubair22.github.io/CSVtoIntacctMapper/) site
2. Upload your **data CSV** (the file with your raw data)
3. Upload your **Intacct template CSV** (the target column format)
4. Click **Preview & Map** to see both files side-by-side
5. Map each Intacct column to a source column (or use **Auto-Map**)
6. Click **Download Mapped CSV** — your file is ready to import into Sage Intacct

## Tech Stack

- HTML, CSS, JavaScript (vanilla — no frameworks, no dependencies)
- Hosted via GitHub Pages

## Local Development

```bash
git clone https://github.com/szubair22/CSVtoIntacctMapper.git
cd CSVtoIntacctMapper
# Open index.html in your browser, or use any static server:
npx serve .
```

## Testing

End-to-end tests are run with [Playwright](https://playwright.dev/) (Chromium, headless). The test suite covers the full user workflow:

| Area | What's tested |
|------|---------------|
| Page load | Title, heading, all key DOM elements present |
| Initial state | Upload button disabled, preview/mapping/download sections hidden |
| File upload | Drop zone states, file name display, button enables after both files selected |
| CSV parsing | Headers, row count, RFC-compliant quoted field handling (`"Carol, Jr."`) |
| Tab switching | Source Data / Intacct Template preview tabs toggle correctly |
| Mapping form | Correct number of rows, select options populated, live counter |
| Manual mapping | Selection applies `.mapped` class, counter updates |
| Auto-map | Fuzzy name matching (e.g. `EMAIL` → `Email`) |
| Download | Full CSV output validated — headers, decimal formatting, quoted fields, empty unmapped columns |
| Toast notifications | Notification element rendered |
| Console errors | Zero JS errors on page load |

To run locally:

```bash
# Start a local server
python3 -m http.server 8099 &

# Install Playwright and run tests
npm install playwright
node e2e-test.mjs
```

## Contributing

The `main` branch is protected — all changes require a pull request with at least one approving review. Fork the repo, create a feature branch, and open a PR.

## License

MIT
