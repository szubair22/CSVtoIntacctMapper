/* ============================================
   IntacctMapper — Application Logic
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM refs ---
    const uploadForm      = document.getElementById('uploadForm');
    const uploadBtn       = document.getElementById('uploadBtn');
    const dataFileInput   = document.getElementById('dataFile');
    const templateFileInput = document.getElementById('templateFile');
    const dataDropZone    = document.getElementById('dataDropZone');
    const templateDropZone = document.getElementById('templateDropZone');
    const dataFileNameEl  = document.getElementById('dataFileName');
    const templateFileNameEl = document.getElementById('templateFileName');
    const previewSection  = document.getElementById('previewSection');
    const mappingSection  = document.getElementById('mappingSection');
    const downloadSection = document.getElementById('downloadSection');
    const dataPreviewEl   = document.getElementById('dataPreview');
    const templatePreviewEl = document.getElementById('templatePreview');
    const mappingForm     = document.getElementById('mappingForm');
    const generateBtn     = document.getElementById('generateBtn');
    const autoMapBtn      = document.getElementById('autoMapBtn');
    const clearMapBtn     = document.getElementById('clearMapBtn');
    const mappingCountEl  = document.getElementById('mappingCount');
    const rowCountEl      = document.getElementById('rowCount');

    // --- State ---
    let dataRows = [];
    let dataHeaders = [];
    let templateHeaders = [];

    // =========================================
    // CSV Parser — handles quoted fields
    // =========================================
    function parseCSV(text) {
        // Strip UTF-8 BOM so the first header isn't corrupted by an invisible char.
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        const rows = [];
        let current = '';
        let inQuotes = false;
        const row = [];

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];

            if (inQuotes) {
                if (ch === '"' && next === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    row.push(current.trim());
                    current = '';
                } else if (ch === '\n' || ch === '\r') {
                    row.push(current.trim());
                    if (row.length > 1 || row[0] !== '') rows.push([...row]);
                    row.length = 0;
                    current = '';
                    if (ch === '\r' && next === '\n') i++;
                } else {
                    current += ch;
                }
            }
        }
        // Last row
        row.push(current.trim());
        if (row.length > 1 || row[0] !== '') rows.push([...row]);

        return rows;
    }

    // =========================================
    // File reading
    // =========================================
    async function readFileAsText(file) {
        return file.text();
    }

    // =========================================
    // Drop zone UX
    // =========================================
    function setupDropZone(zone, input, nameEl) {
        ['dragenter', 'dragover'].forEach(ev =>
            zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); })
        );
        ['dragleave', 'drop'].forEach(ev =>
            zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); })
        );
        zone.addEventListener('drop', e => {
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                input.files = e.dataTransfer.files;
                markFile(zone, nameEl, file.name);
                checkReady();
            }
        });
        input.addEventListener('change', () => {
            if (input.files[0]) {
                markFile(zone, nameEl, input.files[0].name);
                checkReady();
            }
        });
    }

    function markFile(zone, nameEl, name) {
        zone.classList.add('has-file');
        nameEl.textContent = name;
    }

    function checkReady() {
        uploadBtn.disabled = !(dataFileInput.files[0] && templateFileInput.files[0]);
    }

    setupDropZone(dataDropZone, dataFileInput, dataFileNameEl);
    setupDropZone(templateDropZone, templateFileInput, templateFileNameEl);

    // =========================================
    // Preview tabs
    // =========================================
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const which = tab.dataset.tab;
            dataPreviewEl.classList.toggle('hidden', which !== 'data');
            templatePreviewEl.classList.toggle('hidden', which !== 'template');
        });
    });

    // =========================================
    // Upload & preview
    // =========================================
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataFile = dataFileInput.files[0];
        const templateFile = templateFileInput.files[0];
        if (!dataFile || !templateFile) return;

        const [dataText, templateText] = await Promise.all([
            readFileAsText(dataFile),
            readFileAsText(templateFile)
        ]);

        const dataParsed = parseCSV(dataText);
        const templateParsed = parseCSV(templateText);

        if (dataParsed.length < 2) { showToast('Data CSV must have a header row and at least one data row.'); return; }
        if (templateParsed.length < 1) { showToast('Template CSV must have at least a header row.'); return; }

        dataHeaders = dataParsed[0];
        dataRows = dataParsed.slice(1);
        templateHeaders = templateParsed[0];

        // Render previews
        dataPreviewEl.innerHTML = buildTable(dataHeaders, dataRows.slice(0, 5));
        templatePreviewEl.innerHTML = buildTable(templateHeaders, templateParsed.slice(1, 6));

        // Build mapping form
        buildMappingForm();

        // Show sections with animation
        reveal(previewSection);
        reveal(mappingSection);
        reveal(downloadSection);

        // Update row count
        rowCountEl.textContent = `Your mapped CSV will contain ${dataRows.length.toLocaleString()} row${dataRows.length === 1 ? '' : 's'}.`;

        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('Files parsed successfully!');
    });

    // =========================================
    // Table builder
    // =========================================
    function buildTable(headers, rows) {
        const esc = s => {
            const d = document.createElement('div');
            d.textContent = s;
            return d.innerHTML;
        };
        let html = '<table><thead><tr>';
        headers.forEach(h => { html += `<th>${esc(h)}</th>`; });
        html += '</tr></thead><tbody>';
        rows.forEach(row => {
            html += '<tr>';
            headers.forEach((_, i) => { html += `<td>${esc(row[i] || '')}</td>`; });
            html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    // =========================================
    // Mapping form
    // =========================================
    // Excel-style column letter: 0 -> A, 25 -> Z, 26 -> AA.
    function colLetter(i) {
        let s = '';
        i = i + 1;
        while (i > 0) {
            const r = (i - 1) % 26;
            s = String.fromCharCode(65 + r) + s;
            i = Math.floor((i - 1) / 26);
        }
        return s;
    }

    // Label a source column unambiguously even when the header is blank or
    // duplicated. The select's value is the column INDEX (as a string) so
    // duplicate/blank names can't collide.
    function sourceOptionLabel(name, idx) {
        const letter = colLetter(idx);
        if (!name) return `(Column ${letter} — unnamed)`;
        const dupes = dataHeaders.reduce((n, h) => n + (h === name ? 1 : 0), 0);
        return dupes > 1 ? `${name} [Column ${letter}]` : name;
    }

    function buildMappingForm() {
        mappingForm.textContent = '';
        const sourceOptions = dataHeaders
            .map((dh, i) => `<option value="${i}">${escHTML(sourceOptionLabel(dh, i))}</option>`)
            .join('');
        templateHeaders.forEach(tHeader => {
            const row = document.createElement('div');
            row.className = 'mapping-row';
            row.innerHTML = `
                <div class="mapping-target">
                    <span class="mapping-target-label">${escHTML(tHeader)}</span>
                </div>
                <div class="mapping-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
                <div>
                    <select class="mapping-select" data-target="${escAttr(tHeader)}">
                        <option value="">— skip —</option>
                        ${sourceOptions}
                    </select>
                </div>
            `;
            mappingForm.appendChild(row);
        });

        // Update count on change
        mappingForm.querySelectorAll('.mapping-select').forEach(sel => {
            sel.addEventListener('change', () => {
                sel.classList.toggle('mapped', sel.value !== '');
                updateMappingCount();
            });
        });

        updateMappingCount();
    }

    function updateMappingCount() {
        const total = templateHeaders.length;
        const mapped = mappingForm.querySelectorAll('.mapping-select.mapped').length;
        mappingCountEl.textContent = `${mapped} of ${total} mapped`;
    }

    // =========================================
    // Auto-map (fuzzy match by normalized name)
    // =========================================
    autoMapBtn.addEventListener('click', () => {
        const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const selects = mappingForm.querySelectorAll('.mapping-select');
        let mapped = 0;

        selects.forEach(sel => {
            const target = normalize(sel.dataset.target);
            let bestMatch = '';
            let bestScore = 0;

            // Match by the source HEADER NAME (not by the option value, which is
            // now the column index). Skip blank-named source columns.
            dataHeaders.forEach((dh, i) => {
                if (!dh) return;
                const norm = normalize(dh);
                if (!norm) return;
                if (norm === target) {
                    if (bestScore < 100) { bestMatch = String(i); bestScore = 100; }
                    return;
                }
                if (norm.includes(target) || target.includes(norm)) {
                    const score = Math.min(norm.length, target.length) / Math.max(norm.length, target.length) * 80;
                    if (score > bestScore) { bestScore = score; bestMatch = String(i); }
                }
            });

            if (bestScore >= 40) {
                sel.value = bestMatch;
                sel.classList.add('mapped');
                mapped++;
            }
        });

        updateMappingCount();
        showToast(`Auto-mapped ${mapped} column${mapped === 1 ? '' : 's'}`);
    });

    // =========================================
    // Clear all mappings
    // =========================================
    clearMapBtn.addEventListener('click', () => {
        mappingForm.querySelectorAll('.mapping-select').forEach(sel => {
            sel.value = '';
            sel.classList.remove('mapped');
        });
        updateMappingCount();
        showToast('Mappings cleared');
    });

    // =========================================
    // Generate & download
    // =========================================
    generateBtn.addEventListener('click', () => {
        const mapping = {};
        mappingForm.querySelectorAll('.mapping-select').forEach(sel => {
            if (sel.value) {
                mapping[sel.dataset.target] = sel.value;
            }
        });

        if (Object.keys(mapping).length === 0) {
            showToast('Map at least one column before downloading.');
            return;
        }

        const output = [templateHeaders.map(h => quoteCSV(h))];
        dataRows.forEach(row => {
            const mapped = templateHeaders.map(header => {
                const sourceIdx = mapping[header];
                if (sourceIdx === undefined) return '';
                const idx = parseInt(sourceIdx, 10);
                if (!Number.isInteger(idx) || idx < 0 || idx >= dataHeaders.length) return '';
                return quoteCSV(row[idx] || '');
            });
            output.push(mapped);
        });

        const csvString = output.map(r => r.join(',')).join('\r\n');
        downloadBlob(csvString, 'mapped_data.csv');
        showToast('Download started!');
    });

    function quoteCSV(val) {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
    }

    function downloadBlob(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    // =========================================
    // Helpers
    // =========================================
    function escHTML(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }
    function escAttr(s) {
        return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
    }

    function reveal(el) {
        el.classList.remove('hidden');
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = '';
    }

    // =========================================
    // Toast
    // =========================================
    let toastEl = document.querySelector('.toast');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
    }
    let toastTimeout;
    function showToast(msg) {
        clearTimeout(toastTimeout);
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2500);
    }
});
