import os
import csv
import io
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'dataFile' not in request.files or 'templateFile' not in request.files:
        return jsonify({'error': 'Both files are required'}), 400
    
    data_file = request.files['dataFile']
    template_file = request.files['templateFile']
    
    if data_file.filename == '' or template_file.filename == '':
        return jsonify({'error': 'Both files must be selected'}), 400
    
    if not allowed_file(data_file.filename) or not allowed_file(template_file.filename):
        return jsonify({'error': 'Only CSV files are allowed'}), 400
    
    data_csv = list(csv.reader(data_file.stream.read().decode('utf-8').splitlines()))
    template_csv = list(csv.reader(template_file.stream.read().decode('utf-8').splitlines()))
    
    return jsonify({
        'dataHeaders': data_csv[0],
        'templateHeaders': template_csv[0],
        'dataPreview': data_csv[1:6],
        'templatePreview': template_csv[1:6]
    })

@app.route('/generate', methods=['POST'])
def generate_mapped_csv():
    mapping = request.json['mapping']
    data_content = request.json['dataContent']
    template_headers = request.json['templateHeaders']
    
    data_csv = list(csv.reader(data_content.splitlines()))
    data_headers = data_csv[0]
    data_rows = data_csv[1:]
    
    output = []
    output.append(template_headers)
    
    for row in data_rows:
        mapped_row = []
        for template_header in template_headers:
            if template_header in mapping:
                data_index = data_headers.index(mapping[template_header])
                mapped_row.append(row[data_index])
            else:
                mapped_row.append('')
        output.append(mapped_row)
    
    output_csv = '\n'.join([','.join(row) for row in output])
    return send_file(
        io.BytesIO(output_csv.encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='mapped_data.csv'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
