uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submission triggered');

    const dataFile = document.getElementById('dataFile').files[0];
    const templateFile = document.getElementById('templateFile').files[0];

    console.log('Data file:', dataFile);
    console.log('Template file:', templateFile);

    if (!dataFile || !templateFile) {
        alert('Please select both CSV files.');
        return;
    }

    const dataCSV = await readCSV(dataFile);
    const templateCSV = await readCSV(templateFile);

    console.log('Data CSV:', dataCSV);
    console.log('Template CSV:', templateCSV);

    displayPreview(dataCSV, templateCSV);
    createMappingForm(dataCSV[0], templateCSV[0]);

    // Ensure these elements are initially hidden and log their visibility status
    console.log('Preview Section initially hidden:', previewSection.classList.contains('hidden'));
    console.log('Mapping Section initially hidden:', mappingSection.classList.contains('hidden'));
    console.log('Download Section initially hidden:', downloadSection.classList.contains('hidden'));

    previewSection.classList.remove('hidden');
    mappingSection.classList.remove('hidden');
    downloadSection.classList.remove('hidden');

    dataContent = dataCSV.slice(1).map(row => row.join(',')).join('\n');
    templateHeaders = templateCSV[0];
    dataHeaders = dataCSV[0];
});