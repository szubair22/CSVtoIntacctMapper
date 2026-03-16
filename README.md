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

## License

MIT
