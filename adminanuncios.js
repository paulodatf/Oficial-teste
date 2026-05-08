function carregarAdmin() {
    const anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
    const container = document.getElementById('listaAdmin');
    
    if (anuncios.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Nenhum anúncio cadastrado.</p>';
        return;
    }

    container.innerHTML = anuncios.map(a => {
        if (!a.status) a.status = 'pendente';
        if (a.denuncias === undefined) a.denuncias = 0;

        const badgeClass = `badge-${a.status}`;
        // Limpa o número do vendedor para o link
        const foneVendedor = a.whatsapp ? a.whatsapp.replace(/\D/g, '') : "";
        
        return `
            <div class="card-admin">
                ${a.foto ? `<img src="${a.foto}" class="foto-admin">` : `<div class="foto-admin" style="background:#eee; display:flex; align-items:center; justify-content:center;"><i class="fas fa-image"></i></div>`}
                <div class="info-admin">
                    <div class="titulo-admin">${a.titulo}</div>
                    <div>ID: <strong>${a.id}</strong> | Cat: ${a.categoria}</div>
                    <div style="background: #eef6ff; padding: 5px; border-radius: 4px; margin: 5px 0; border: 1px solid #cce5ff;">
                        <i class="fab fa-whatsapp"></i> <strong>Vendedor:</strong> ${a.whatsapp || 'Não informado'}
                    </div>
                    <div>Status: <span class="badge ${badgeClass}">${a.status}</span></div>
                    <div style="color: ${a.denuncias > 0 ? 'red' : '#666'}">Denúncias: ${a.denuncias}</div>
                    
                    <div class="acoes">
                        <button onclick="alterarStatus('${a.id}', 'aprovado')" class="btn btn-aprovar">Aprovar</button>
                        <button onclick="alterarStatus('${a.id}', 'rejeitado')" class="btn btn-rejeitar">Rejeitar</button>
                        <button onclick="excluirAnuncio('${a.id}')" class="btn btn-excluir">Excluir Permanente</button>
                        <a href="https://wa.me/55${foneVendedor}" target="_blank" class="btn btn-whats">Falar com Vendedor</a>
                    </div>
                </div>
            </div>
        `;
    }).reverse().join(''); 
}

function alterarStatus(id, novoStatus) {
    let anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
    const index = anuncios.findIndex(a => a.id == id);
    
    if (index !== -1) {
        anuncios[index].status = novoStatus;
        if(novoStatus === 'aprovado') anuncios[index].denuncias = 0;
        
        localStorage.setItem('pedeai_anuncios', JSON.stringify(anuncios));
        carregarAdmin();
    }
}

function excluirAnuncio(id) {
    if (confirm('Tem certeza que deseja excluir permanentemente este anúncio?')) {
        let anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
        anuncios = anuncios.filter(a => a.id != id);
        localStorage.setItem('pedeai_anuncios', JSON.stringify(anuncios));
        carregarAdmin();
    }
}

document.addEventListener('DOMContentLoaded', carregarAdmin);