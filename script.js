document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const previewSection = document.getElementById('previewSection');
    const mappingSection = document.getElementById('mappingSection');
    const mappingForm = document.getElementById('mappingForm');
    const downloadSection = document.getElementById('downloadSection');
    const generateBtn = document.getElementById('generateBtn');

    const dataFileInput = document.getElementById('dataFile');
    const templateFileInput = document.getElementById('templateFile');
    const dataFileName = document.getElementById('dataFileName');
    const templateFileName = document.getElementById('templateFileName');

    let dataContent = '';
    let templateHeaders = [];
    let dataHeaders = [];

    // Add event listeners for file input changes
    dataFileInput.addEventListener('change', (e) => {
        updateFileName(e.target, dataFileName);
    });

    templateFileInput.addEventListener('change', (e) => {
        updateFileName(e.target, templateFileName);
    });

    // Function to update file name display
    function updateFileName(fileInput, fileNameElement) {
        if (fileInput.files.length > 0) {
            fileNameElement.textContent = fileInput.files[0].name;
        } else {
            fileNameElement.textContent = 'No file chosen';
        }
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataFile = dataFileInput.files[0];
        const templateFile = templateFileInput.files[0];

        if (!dataFile || !templateFile) {
            alert('Please select both CSV files.');
            return;
        }

        const dataCSV = await readCSV(dataFile);
        const templateCSV = await readCSV(templateFile);

        displayPreview(dataCSV, templateCSV);
        createMappingForm(dataCSV[0], templateCSV[0]);
        previewSection.classList.remove('hidden');
        mappingSection.classList.remove('hidden');
        downloadSection.classList.remove('hidden');

        dataContent = dataCSV.slice(1).map(row => row.join(',')).join('\n');
        templateHeaders = templateCSV[0];
        dataHeaders = dataCSV[0];
    });

    async function readCSV(file) {
        const content = await file.text();
        return content.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    }

    function displayPreview(dataCSV, templateCSV) {
        const dataPreview = document.getElementById('dataPreview');
        const templatePreview = document.getElementById('templatePreview');

        dataPreview.innerHTML = createTable(dataCSV[0], dataCSV.slice(1, 6));
        templatePreview.innerHTML = createTable(templateCSV[0], templateCSV.slice(1, 6));
    }

    function createTable(headers, rows) {
        let table = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
        headers.forEach(header => {
            table += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`;
        });
        table += '</tr></thead><tbody>';
        rows.forEach((row, index) => {
            table += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
            row.forEach(cell => {
                table += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cell}</td>`;
            });
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    }

    function createMappingForm(dataHeaders, templateHeaders) {
        mappingForm.innerHTML = `
            <div class="mapping-header">
                <div class="template-header">Template Headers</div>
                <div class="data-header">Data Headers</div>
            </div>
        `;
        
        templateHeaders.forEach(templateHeader => {
            const div = document.createElement('div');
            div.className = 'mapping-row';
            div.innerHTML = `
                <div class="template-field">${templateHeader}</div>
                <div class="data-field">
                    <select name="${templateHeader}_field" class="data-select">
                        <option value="">-- Select --</option>
                        ${dataHeaders.map(dataHeader => `<option value="${dataHeader}">${dataHeader}</option>`).join('')}
                    </select>
                </div>
                <div class="format-option">
                    <label>
                        <input type="checkbox" name="${templateHeader}_format">
                        Format as decimal (up to 2 places)
                    </label>
                </div>
            `;
            mappingForm.appendChild(div);
        });
    }

    generateBtn.addEventListener('click', () => {
        const mapping = {};
        const formData = new FormData(mappingForm);
        
        templateHeaders.forEach(header => {
            const field = formData.get(`${header}_field`);
            const format = formData.get(`${header}_format`) === 'on';
            
            if (field) {
                mapping[header] = {
                    field: field,
                    format: format
                };
            }
        });

        const mappedCSV = generateMappedCSV(mapping, dataContent, templateHeaders, dataHeaders);
        downloadCSV(mappedCSV, 'mapped_data.csv');
    });

    function generateMappedCSV(mapping, dataContent, templateHeaders, dataHeaders) {
        const dataRows = dataContent.split('\n').map(row => row.split(','));
        const output = [templateHeaders];

        dataRows.forEach(row => {
            const mappedRow = templateHeaders.map(header => {
                if (header in mapping) {
                    const mapInfo = mapping[header];
                    const dataIndex = dataHeaders.indexOf(mapInfo.field);
                    let value = row[dataIndex] || '';
                    if (mapInfo.format) {
                        value = formatDecimal(value);
                    }
                    return value;
                }
                return '';
            });
            output.push(mappedRow);
        });

        return output.map(row => row.join(',')).join('\n');
    }

    function formatDecimal(value) {
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toFixed(2);
    }

    function downloadCSV(content, fileName) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
});