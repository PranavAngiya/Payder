# BuaServer.py
#
# Open a web browser and go to http://localhost:5050/.
# The server will serve the index.html file and static files from the static folder.

# from flask import Flask
# app = Flask(__name__)

import os, asyncio, nest_asyncio
nest_asyncio.apply()

from quart import Quart, request, send_file, jsonify
from quart_cors import cors
app = Quart(__name__)
cors(app)

@app.route('/', methods=['GET']) # serve the index.html file to the client
async def _indexFile():
    file_path = os.path.join(os.path.dirname(__file__), 'index.html')
    print('-----------_indexFile() ', file_path)
    if os.path.exists(file_path):
        return await send_file(file_path)
    else:
        return jsonify({'error: file not found'}), 404

@app.route('/favicon.ico', methods=['GET']) # serve the index.html file to the client
async def _favicon():
    file_path = os.path.join(app.static_folder, 'favicon-96x96.png')
    print('-----------_favicon() ', file_path)
    if os.path.exists(file_path):
        return await app.send_static_file('favicon-96x96.png')
    else:
        return jsonify({'error: file not found'}), 404

@app.route('/taskSamples.csv', methods=['GET']) # serve the index.html file to the client
async def serve_taskSamples():
    file_path = os.path.join(os.path.dirname(__file__), 'taskSamples.csv')
    print('-----------serve_taskSamples() ', file_path)
    if os.path.exists(file_path):
        return await send_file(file_path)
    else:
        return jsonify({'error': 'File not found'}), 404   

@app.route('/SearchKey', methods=['GET'])
async def serve_SearchKey():
    searchKey = request.args.get('searchKey', default='*', type=str)
    print(f'-----------serve_SearchKey() searchKey: {searchKey}')

    if not searchKey:
        return jsonify({'error': 'searchKey is missing'}), 400

    file_path = os.path.join(os.path.dirname(__file__), 'taskSamples.csv')
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404   

    if searchKey == '*':
        print('-----------Serve_SearchKey() ', file_path)
        if os.path.exists(file_path):
            return await send_file(file_path)
        else:
            return jsonify({'error': 'File not found'}), 404
    
    import csv
    matching_rows = []
    searchKey = searchKey.strip()
    searchKey = searchKey.lower()

    with open(file_path, mode='r', encoding='utf-8') as csvfile:
        headers = ['Column1', 'Column2', 'Column3']
        reader = csv.DictReader(csvfile, fieldnames=headers, delimiter='|') 
        for row in reader:
            for column in headers:
                if row[column] and searchKey in row[column].lower():
                    matching_rows.append(row)
                    break
    if matching_rows:
        return jsonify({'matches': matching_rows})
    else:
        return jsonify({'message': 'No matching rows found'}), 404
  

import BuaTasks

@app.route('/FinUrl', methods=['POST'])
async def _FinUrl():
    data = await request.json
    print(f'-----------_FinUrl() req: ', data)
    symbol, url = await BuaTasks.FinUrl(data)
    print(f'-----------_FinUrl() res: {symbol}, {url}')
    return jsonify({'symbol':symbol, 'url': url})

@app.route('/NextPrice', methods=['POST'])
async def _NextPrice():
    data = await request.json
    print(f'-----------_NextPrice() req: ', data)
    symbol, price, data = await BuaTasks.NextPrice(data)
    print(f'-----------_NextPrice() res: {symbol}, {price}, {data}')
    return jsonify({'symbol':symbol, 'price': price, 'data': data})

@app.route('/AskBua', methods=['POST'])
async def _AskBua():
    data = await request.json
    print(f'-----------_AskBua() req:', data)
    result = await BuaTasks.AskBua(data)
    print(f'-----------_AskBua() res: {result}')
    return jsonify({'AI Agent':'BUA', 'Result': result})

@app.route('/AskOpenAi', methods=['POST'])
async def _AskOpenAi():
    data = await request.json
    print(f'-----------_AskOpenAi() req:', data)
    result = await BuaTasks.AskOpenAi(data)
    print(f'-----------_AskOpenAi() res: {result}')
    return result

@app.route('/AskGemini', methods=['POST'])
async def _AskGemni():
    data = await request.json
    print(f'-----------_AskGemini() req:', data)
    result = await BuaTasks.AskGemini(data)
    print(f'-----------_AskGemini() res: {result}')
    return result

@app.route('/AskBard', methods=['POST'])
async def _AskBard():
    data = await request.json
    print(f'-----------_AskBard() req:', data)
    result = await BuaTasks.AskBard(data)
    print(f'-----------_AskBard() res: {result}')
    return result

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5050, log_level="info")

