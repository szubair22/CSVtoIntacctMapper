document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const previewSection = document.getElementById('previewSection');
    const mappingSection = document.getElementById('mappingSection');
    const mappingForm = document.getElementById('mappingForm');
    const downloadSection = document.getElementById('downloadSection');
    const generateBtn = document.getElementById('generateBtn');

    let dataContent = '';
    let templateHeaders = [];
    let dataHeaders = [];

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            displayPreview(data);
            createMappingForm(data.dataHeaders, data.templateHeaders);
            previewSection.classList.remove('hidden');
            mappingSection.classList.remove('hidden');
            downloadSection.classList.remove('hidden');

            // Store data content and headers for later use
            dataContent = data.dataPreview.map(row => row.join(',')).join('\n');
            templateHeaders = data.templateHeaders;
            dataHeaders = data.dataHeaders;
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading the files. Please try again.');
        }
    });

    function displayPreview(data) {
        const dataPreview = document.getElementById('dataPreview');
        const templatePreview = document.getElementById('templatePreview');

        dataPreview.innerHTML = createTable(data.dataHeaders, data.dataPreview);
        templatePreview.innerHTML = createTable(data.templateHeaders, data.templatePreview);
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
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="${templateHeader}_field" class="block mb-1">Field:</label>
                        <select id="${templateHeader}_field" name="${templateHeader}_field" class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                            <option value="">-- Select --</option>
                            ${dataHeaders.map(dataHeader => `<option value="${dataHeader}">${dataHeader}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="${templateHeader}_transform" class="block mb-1">Transform:</label>
                        <select id="${templateHeader}_transform" name="${templateHeader}_transform" class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                            <option value="">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="trim">Trim</option>
                            <option value="multiply">Multiply</option>
                            <option value="add">Add</option>
                            <option value="concat">Concatenate</option>
                        </select>
                    </div>
                    <div>
                        <label for="${templateHeader}_param" class="block mb-1">Parameter:</label>
                        <input type="text" id="${templateHeader}_param" name="${templateHeader}_param" class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" placeholder="Enter parameter">
                    </div>
                </div>
            `;
            mappingForm.appendChild(div);
        });
    }

    generateBtn.addEventListener('click', async () => {
        const mapping = {};
        const formData = new FormData(mappingForm);
        
        templateHeaders.forEach(header => {
            const field = formData.get(`${header}_field`);
            const transform = formData.get(`${header}_transform`);
            const param = formData.get(`${header}_param`);
            
            if (field) {
                mapping[header] = {
                    field: field,
                    transform: transform || null,
                    param: param || null
                };
            }
        });

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapping: mapping,
                    dataContent: dataContent,
                    templateHeaders: templateHeaders,
                    dataHeaders: dataHeaders
                })
            });

            if (!response.ok) {
                throw new Error('Generation failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'mapped_data.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the mapped CSV. Please try again.');
        }
    });
});
