// Preview da Imagem
document.getElementById('fotoFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('imgPreview').src = event.target.result;
            document.getElementById('imgPreview').style.display = 'block';
            document.getElementById('previewPlaceholder').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

const tipoSelecionado = localStorage.getItem('pedeai_tipo_anuncio') || 'rapido';
const avisoBox = document.getElementById('statusPlano');

// Define o texto do topo baseado no plano
if (tipoSelecionado === 'rapido') {
    avisoBox.innerHTML = '<i class="fas fa-bolt"></i> Seu anúncio será publicado e os clientes falarão direto com você.';
} else {
    avisoBox.innerHTML = '<i class="fas fa-handshake"></i> Você só paga após vender. Nós vamos falar com os clientes por você.';
}

async function uploadParaCloudinary(file) {
    const cloudName = 'de0cvvii9'; 
    const uploadPreset = 'pedeairapido'; 
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        return null;
    }
}

document.getElementById('formAnuncio').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviar');
    const file = document.getElementById('fotoFile').files[0];

    // Validação de Imagem (Sempre obrigatória agora)
    if (!file) {
        alert("Atenção: A foto é obrigatória.");
        return;
    }

    btn.disabled = true;
    let fotoUrl = null;

    btn.innerText = "Enviando Imagem...";
    fotoUrl = await uploadParaCloudinary(file);
    
    if (!fotoUrl) {
        alert("Erro no upload da imagem.");
        btn.disabled = false;
        btn.innerText = "Publicar Anúncio";
        return;
    }

    const novoAnuncio = {
        id: Date.now(),
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value, 
        preco: document.getElementById('preco').value || 0,
        whatsapp: document.getElementById('whatsapp').value, 
        plano: tipoSelecionado,
        foto: fotoUrl,
        descricao: document.getElementById('descricao').value,
        status: 'aprovado',
        dataCriacao: Date.now(),
        dataExpiracao: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    const anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
    anuncios.push(novoAnuncio);
    localStorage.setItem('pedeai_anuncios', JSON.stringify(anuncios));

    alert('Anúncio enviado com sucesso!');
    window.location.href = 'anuncios.html';
});