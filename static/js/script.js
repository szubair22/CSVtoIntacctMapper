document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const previewSection = document.getElementById('previewSection');
    const mappingSection = document.getElementById('mappingSection');
    const mappingForm = document.getElementById('mappingForm');
    const downloadSection = document.getElementById('downloadSection');
    const generateBtn = document.getElementById('generateBtn');

    const dataFileInput = document.getElementById('dataFile');
    const templateFileInput = document.getElementById('templateFile');
    const dataFileNameDisplay = document.getElementById('dataFileName');
    const templateFileNameDisplay = document.getElementById('templateFileName');

    let dataContent = '';
    let templateHeaders = [];
    let dataHeaders = [];

    // Update the file name display when a file is selected
    dataFileInput.addEventListener('change', () => {
        dataFileNameDisplay.value = dataFileInput.files.length > 0 ? dataFileInput.files[0].name : 'No file chosen';
    });

    templateFileInput.addEventListener('change', () => {
        templateFileNameDisplay.value = templateFileInput.files.length > 0 ? templateFileInput.files[0].name : 'No file chosen';
    });

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
        mappingForm.innerHTML = '';
        templateHeaders.forEach(templateHeader => {
            const div = document.createElement('div');
            div.className = 'mb-4';
            div.innerHTML = `
                <label for="${templateHeader}" class="block mb-2 font-bold">${templateHeader}:</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="${templateHeader}_field" class="block mb-1">Field:</label>
                        <select id="${templateHeader}_field" name="${templateHeader}_field" class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                            <option value="">-- Select --</option>
                            ${dataHeaders.map(dataHeader => `<option value="${dataHeader}">${dataHeader}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="${templateHeader}_format" class="block mb-1">
                            <input type="checkbox" id="${templateHeader}_format" name="${templateHeader}_format" class="mr-2">
                            Format as decimal (up to 2 places)
                        </label>
                    </div>
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
