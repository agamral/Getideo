document.addEventListener('DOMContentLoaded', function() {
    const socket = io('http://127.0.0.1:5000');
    const progressBar = document.getElementById('progress-bar');
    const message = document.getElementById('message');
    const form = document.getElementById('download-form');
    let downloadedFile = '';

    socket.on('progress', function(data) {
        const percentComplete = data.progress;
        progressBar.style.width = percentComplete;
    
        if (percentComplete === '100%') {
            progressBar.classList.remove('started', 'halfway');
            progressBar.classList.add('complete');
            message.innerText = "Download concluído!";
        } else if (percentComplete.includes('%')) {
            const progressValue = parseFloat(percentComplete);
            if (progressValue < 50) {
                progressBar.classList.remove('complete');
                progressBar.classList.add('started');
                message.innerText = "Download iniciado...";
            } else {
                progressBar.classList.remove('started');
                progressBar.classList.add('halfway');
                message.innerText = "Download em andamento...";
            }
        } else {
            progressBar.classList.remove('started', 'halfway', 'complete');
            message.innerText = "Progresso: " + percentComplete;
        }
    });
    

    // Evento de download completo
    socket.on('download_complete', function(data) {
        message.innerText = data.message;
        downloadedFile = data.filename;
        openDownloadFolder(downloadedFile);
    });

    // Envio do formulário de download
    form.onsubmit = async function(event) {
        event.preventDefault();
        const url = document.querySelector('input[name="url"]').value;

        // Resetar a barra de progresso
        progressBar.style.width = '0';
        message.innerText = "Download iniciado! Por favor, aguarde...";

        // Requisição para iniciar o download
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

    // Função para abrir a pasta de downloads
    function openDownloadFolder(filename) {
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);

        link.href = `/file/${encodeURIComponent(filename)}`;
        link.setAttribute('download', '');
        link.click();

        document.body.removeChild(link);
    }
});
