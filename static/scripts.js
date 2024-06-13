document.addEventListener('DOMContentLoaded', function() {
    const socket = io('http://127.0.0.1:5000');
    const progressBar = document.getElementById('progress-bar');
    const message = document.getElementById('message');
    const form = document.getElementById('download-form');
    let downloadedFile = '';

    socket.on('progress', function(data) {
        const percentComplete = data.progress;
        progressBar.style.width = percentComplete;
        message.innerText = "Progresso: " + percentComplete;
    });

    socket.on('download_complete', function(data) {
        message.innerText = data.message;
        downloadedFile = data.filename;
        
        // Abrir automaticamente a pasta de downloads
        openDownloadFolder(downloadedFile);
    });

    form.onsubmit = async function(event) {
        event.preventDefault();
        const url = document.querySelector('input[name="url"]').value;

        message.innerText = "Download iniciado! Por favor, aguarde...";

        fetch('http://127.0.0.1:5000/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `url=${encodeURIComponent(url)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                message.innerText = data.message;
            } else if (data.error) {
                message.innerText = data.error;
            }
        })
        .catch(error => {
            message.innerText = "Ocorreu um erro: " + error.message;
            console.error('Erro:', error);
        });
    };

    function openDownloadFolder(filename) {
        // Criar um link oculto
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);

        // Definir o URL do link para o endpoint do Flask que serve o arquivo
        link.href = `/file/${encodeURIComponent(filename)}`;
        link.setAttribute('download', '');

        // Simular o clique no link para abrir a pasta de downloads
        link.click();

        // Limpar o link depois que ele for utilizado
        document.body.removeChild(link);
    }
});
