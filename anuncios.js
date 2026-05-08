// CONFIGURAÇÃO: Número oficial do suporte/atendimento (ADMIN)
const WHATSAPP_ADMIN = "5599999999999"; 

let categoriaAtual = 'Todos';

function carregarAnuncios() {
    const anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
    const container = document.getElementById('listaAnuncios');
    const agora = Date.now();

    const ativos = anuncios.filter(a => {
        const expirado = a.dataExpiracao && agora > a.dataExpiracao;
        const statusOk = a.status === 'aprovado' && !expirado;
        
        if (categoriaAtual === 'Todos') return statusOk;
        return statusOk && a.categoria === categoriaAtual;
    });

    if (ativos.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 80px 20px;">
                <i class="fas fa-search" style="font-size: 40px; color: #D1D1D6; margin-bottom: 16px;"></i>
                <p style="color:#8E8E93; font-weight: 500;">Nenhum anúncio em "${categoriaAtual}"</p>
            </div>`;
        return;
    }

    container.innerHTML = ativos.map(a => {
        const precoExibicao = typeof a.preco === 'number' 
            ? a.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
            : `R$ ${a.preco}`;

        const temImagem = a.foto && a.foto.trim() !== "";

        return `
            <div class="card-anuncio" onclick="window.location.href='detalhe-anuncio.html?id=${a.id}'" style="cursor:pointer">
                <div class="card-img-container">
                    ${temImagem ? `<img src="${a.foto}" loading="lazy">` : `
                        <div style="display:flex; align-items:center; justify-content:center; color:#D1D1D6; height:100%;">
                            <i class="fas fa-image fa-2x"></i>
                        </div>
                    `}
                </div>
                <div class="card-content">
                    <div class="card-title">${a.titulo}</div>
                    <div class="card-price">${precoExibicao}</div>
                </div>
            </div>
        `;
    }).join('');
}

function denunciarAnuncio(id, titulo) {
    let anuncios = JSON.parse(localStorage.getItem('pedeai_anuncios') || '[]');
    let index = anuncios.findIndex(a => a.id == id);
    
    if(index !== -1) {
        anuncios[index].denuncias = (anuncios[index].denuncias || 0) + 1;
        if(anuncios[index].denuncias >= 1) {
            anuncios[index].status = 'pendente';
        }
        localStorage.setItem('pedeai_anuncios', JSON.stringify(anuncios));
        alert('Denúncia enviada. O anúncio será revisado.');
        carregarAnuncios();
    }

    const mensagem = `Olá, gostaria de denunciar o anúncio: ${titulo} (ID: ${id})`;
    window.open(`https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensagem)}`, '_blank');
}

function filtrarCategoria(nome) {
    categoriaAtual = nome;
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
        if(item.querySelector('span').innerText === nome) item.classList.add('active');
    });
    carregarAnuncios();
}

document.getElementById('inputBuscaAnuncio')?.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card-anuncio');
    cards.forEach(card => {
        const titulo = card.querySelector('.card-title').innerText.toLowerCase();
        card.style.display = titulo.includes(termo) ? 'flex' : 'none';
    });
});

function abrirModal() {
    document.getElementById('modalVenda').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    document.getElementById('modalVenda').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function selecionarPlano(tipo) {
    localStorage.setItem('pedeai_tipo_anuncio', tipo);
    window.location.href = 'criaranuncios.html';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalVenda');
    if (event.target == modal) fecharModal();
}

document.addEventListener('DOMContentLoaded', carregarAnuncios);