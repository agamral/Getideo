from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import yt_dlp
import re
import sys
import tempfile
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_download_path():
    if sys.platform.startswith('win'):
        return os.path.join(os.path.expanduser('~'), 'Downloads')
    elif sys.platform.startswith('linux') or sys.platform.startswith('darwin'):
        return os.path.join(os.path.expanduser('~'), 'Downloads')
    return os.getcwd()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_video():
    url = request.form['url']
    if not url:
        return jsonify(error="URL não fornecida."), 400
    
    temp_dir = tempfile.mkdtemp()

    def progress_hook(d):
        if d['status'] == 'downloading':
            progress = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', d['_percent_str']).strip()
            socketio.emit('progress', {'progress': progress})
        elif d['status'] == 'finished':
            socketio.emit('progress', {'progress': '100%'})
            socketio.emit('download_complete', {'message': 'Download concluído', 'filename': d['filename']})
            logger.info(f"Download complete: {d['filename']}")

    ydl_opts = {
        'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        'progress_hooks': [progress_hook]
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.add_default_info_extractors()
            ydl.download([url])
            return jsonify(message="Pronto! O download foi realizado"), 200
    except yt_dlp.utils.DownloadError as e:
        error_message = "Opa! Isso causou algum problema. Atualize a página (F5) e tente novamente. Se persistir, tente outro link."
        if "unsupported URL" in str(e).lower() or "no video found" in str(e).lower():
            error_message = "O link não é suportado ou nenhum vídeo foi encontrado."
        logger.error(f"Download error: {e}")
        return jsonify(error=error_message), 500

@app.route('/file/<path:filename>')
def get_file(filename):
    try:
        return send_file(filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Error sending file: {e}")
        return str(e), 404

if __name__ == '__main__':
    socketio.run(app, debug=True)
