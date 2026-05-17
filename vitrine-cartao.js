import { db, GetRegrasLojista } from './config.js';
import { doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const lojistaId = params.get('lojista') || params.get('seller');
const modo = params.get('modo') || 'produto';
const activeProductId = params.get('product');

let itemAtualConfig = null;
let lojistaInfoCache = null;
window.tamanhoSelecionadoAtual = null;

function otimizarURL(url, width = 400) {
    if (!url || typeof url !== 'string') {
        return "https://via.placeholder.com/300";
    }

    if (!url.includes('cloudinary.com/image/upload')) {
        return url;
    }

    // evita reaplicar otimização
    if (url.includes('f_auto') || url.includes('q_auto')) {
        return url;
    }

    return url.replace(
        '/image/upload/',
        `/image/upload/f_auto,q_auto:eco,w_${width},c_limit/`
    );
}


function gerarLinkDestaque(prodId) {
    const base = window.location.origin + window.location.pathname;
    return `${base}?seller=${lojistaId}&product=${prodId}&modo=${modo}`;
}

async function init() {
    if (!lojistaId) return;
    if (modo === 'gourmet') document.body.classList.add('gourmet-mode');
    await carregarDadosEProdutos();
}

async function carregarDadosEProdutos() {
    const mainContainer = document.getElementById('productDetail');
    try {
        const userDoc = await getDoc(doc(db, "usuarios", lojistaId));
        if (!userDoc.exists()) return;

        lojistaInfoCache = userDoc.data();
        lojistaInfoCache.id = lojistaId;

        const regras = GetRegrasLojista(lojistaInfoCache);
        if (!regras.podeExibirProdutos || regras.isBloqueado) {
            document.getElementById('nomeLojista').innerText = "";
            document.getElementById('fotoLojista').style.display = 'none';
            mainContainer.innerHTML = "";
            return;
        }

        const nomeLoja = (modo === 'gourmet' ? lojistaInfoCache.nomeLojaComida : lojistaInfoCache.nomeLojaGeral) || lojistaInfoCache.nomeLoja || "Loja";
        const fotoLoja = (modo === 'gourmet' ? lojistaInfoCache.fotoPerfilComida : lojistaInfoCache.fotoPerfilGeral) || lojistaInfoCache.fotoPerfil;
        
        document.getElementById('nomeLojista').innerText = nomeLoja;
        document.getElementById('fotoLojista').src = otimizarURL(fotoLoja, 150);
        
        const snap = await getDocs(collection(db, "produtos"));
        let htmlDestaque = "";
        let htmlGridLojista = "";

        snap.forEach(d => {
            const p = d.data();
            if (p.owner !== lojistaId) return;
            if (p.status === "pausado" || p.visivel === false) return; 
            if (modo === 'gourmet' && p.categoria !== 'Comida') return;
            if (modo !== 'gourmet' && p.categoria === 'Comida') return;

            const fotos = Array.isArray(p.foto) ? p.foto : [p.foto];
            const imgCapa = otimizarURL(fotos[0], 1000);
            const linkDestaque = gerarLinkDestaque(d.id);
            
            // Sanitização para evitar quebra de strings no HTML/JS
            const descReal = (p.descricao || "").replace(/'/g, "\\'").replace(/\n/g, " ");
            const nomeReal = p.nome.replace(/'/g, "\\'");
            const adicionaisKey = `adic_${d.id}`;
            window[adicionaisKey] = p.adicionais || [];
            
            if (d.id === activeProductId) {
                if (modo === 'gourmet') {
                    htmlDestaque = `
                        <div class="container-gourmet-destaque">
                            <img src="${imgCapa}" class="img-gourmet-destaque">
                            <h2 class="titulo-gourmet-destaque">${p.nome}</h2>
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <div class="preco-gourmet-destaque" style="margin-bottom:0;">R$ ${p.preco}</div>
                                <div class="menu-produto-wrap" onclick="event.stopPropagation()">
                                    <button class="btn-menu-produto" onclick="window.toggleMenuDenuncia(event, '${d.id}')">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <div class="menu-flutuante-produto" id="menu-${d.id}">
                                        <div class="menu-item-produto" onclick="window.denunciarProduto('${d.id}', '${nomeReal}')">
                                            <i class="fas fa-flag"></i>
                                            Denunciar produto
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card-desc-gourmet">
                                <i class="fas fa-quote-left"></i>
                                <p class="texto-desc-gourmet">${p.descricao || 'Sem descrição disponível.'}</p>
                            </div>
                            <div class="container-botoes-gourmet">
                              <button onclick="window.tratarBotaoAdicionar('${d.id}', '${nomeReal}', '${p.preco}', '${p.owner}', '${p.whatsapp}', '${otimizarURL(fotos[0], 100)}', '${gerarLinkDestaque(d.id)}', '${descReal}')" class="btn-action-main" style="background:var(--ifood-red);">ADICIONAR</button>
${lojistaInfoCache.montarAtivo && p.permiteMontar === true ? `<button onclick="window.abrirConfigComida('montar_global', true)" class="btn-action-main btn-montar-inline"><i class="fas fa-utensils"></i> MONTAR</button>` : ''}
                            </div>
                        </div><hr style="border:0; border-top:8px solid #f8f8f8; margin:0;">`;
                } else {
                    htmlDestaque = `
                        <div class="destaque-produto-modo-prod">
                            <div class="container-img-padrao">
                                <img src="${imgCapa}" class="img-padrao-display">
                            </div>
                            <div class="info-area-prod">
                                <h2>${p.nome}</h2>
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div class="preco-destaque" style="margin-bottom:0;">R$ ${p.preco}</div>
                                    <div class="menu-produto-wrap" onclick="event.stopPropagation()">
                                        <button class="btn-menu-produto" onclick="window.toggleMenuDenuncia(event, '${d.id}')">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="menu-flutuante-produto" id="menu-${d.id}">
                                            <div class="menu-item-produto" onclick="window.denunciarProduto('${d.id}', '${nomeReal}')">
                                                <i class="fas fa-flag"></i>
                                                Denunciar produto
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="desc-produto-simples">${p.descricao || 'Nenhuma descrição informada.'}</div>
                                ${p.tipoProduto === 'roupa' ? `
                                    <div class="tamanho-container">
                                        <div style="font-size:13px; color:#666; margin-bottom:5px;">Tamanho</div>
                                        <div class="tamanho-grid">${['P','M','G','GG'].map(t => `<div class="btn-tamanho" onclick="selecionarTamanho(this, '${t}')">${t}</div>`).join('')}</div>
                                    </div>` : ''}
                                <button onclick="window.adicionarAoCarrinho('${d.id}', '${nomeReal}', '${p.preco}', '${p.owner}', '${p.whatsapp}', '${otimizarURL(fotos[0], 100)}', '${linkDestaque}', '${descReal}')" class="btn-action-main" style="background:var(--orange);">Compre agora</button>
                            </div>
                        </div><hr style="border:0; border-top:8px solid #eee; margin:0;">`;
                }
            } else {
                // Aplica lógica visual idêntica ao vitrine.js: cover para gourmet, contain para outros
                let estiloImagemCard = `
    object-fit: cover;
    padding: 0;
    background: none;
`;

// AJUSTE SOMENTE PRODUTOS
if (modo !== 'gourmet') {

    estiloImagemCard = `
        width: 100%;
        height: 230px;
        background: #fcfcfc;
        padding: 4px;
        border-radius: 14px 14px 0 0;
        display: block;
        transition: 0.2s;
    `;

}

htmlGridLojista += `
    <div class="card-p" onclick="if(!event.target.closest('.menu-produto-wrap')) window.location.href='?lojista=${lojistaId}&product=${d.id}&modo=${modo}'">

        <img 
            src="${otimizarURL(fotos[0], 400)}"
            loading="lazy"

            onload="
                const w = this.naturalWidth;
                const h = this.naturalHeight;

                if('${modo}' !== 'gourmet') {

                    if(h > w) {

                        // FOTO VERTICAL
                        this.style.objectFit = 'contain';
                        this.style.objectPosition = 'center';

                        // AJUSTE FINO
                        this.style.scale = '1.06';

                    }

                    else if(w > h) {

                        // FOTO HORIZONTAL
                        this.style.objectFit = 'cover';
                        this.style.objectPosition = 'center';

                        // AJUSTE FINO
                        this.style.scale = '1.02';

                    }

                    else {

                        // FOTO QUADRADA
                        this.style.objectFit = 'contain';
                        this.style.objectPosition = 'center';

                        this.style.scale = '1.04';

                    }

                }
            "

            style="${estiloImagemCard}"
        >

        <div class="card-p-info">
            <div class="card-p-name">${p.nome}</div>
            <div class="card-p-price">R$ ${p.preco}</div>
            </div>

    </div>
`;
                
            }
        });

        mainContainer.innerHTML = htmlDestaque + (htmlGridLojista ? `<div style="padding:15px 15px 5px; font-weight:800; color:#555; font-size:13px;">MAIS PRODUTOS:</div><div class="grid-produtos">${htmlGridLojista}</div>` : "");
    } catch (e) { console.error(e); }
}

window.selecionarTamanho = (btn, tamanho) => {
    document.querySelectorAll('.btn-tamanho').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    window.tamanhoSelecionadoAtual = tamanho;
};

window.abrirConfigComida = async (id, isGlobal = false, isIntermediario = false) => {
    if (isGlobal) {
        itemAtualConfig = { id: 'montar_global', nome: lojistaInfoCache.montarTitulo || "Personalizado", preco: "0,00", variacoes: lojistaInfoCache.montarVariacoes || [], adicionais: lojistaInfoCache.montarAdicionais || [], isMontarGlobal: true, owner: lojistaInfoCache.id, whatsapp: lojistaInfoCache.whatsapp, foto: lojistaInfoCache.fotoPerfilComida, descricao: "" };
    } else {
        const d = await getDoc(doc(db, "produtos", id));
        const data = d.data();
        // Mescla adicionais do produto com os adicionais gerais da loja (reaproveitando a estrutura do MONTAR)
        itemAtualConfig = { ...data, id: d.id, adicionais: data.adicionais || [] };
    }
    renderizarModalConfig(isIntermediario);
};

function renderizarModalConfig(isIntermediario = false) {
    const content = document.getElementById('modalContent');
    document.getElementById('modalNome').innerText = itemAtualConfig.nome;
    
    // Alimenta a caixinha de detalhes existente no HTML
    const descBox = document.getElementById('texto-descricao-gourmet');
    if (descBox) {
        descBox.innerHTML = `<b style="color:var(--ifood-red);">R$ ${itemAtualConfig.preco}</b><br>${itemAtualConfig.descricao || ''}`;
    }

    let html = '';

    if (isIntermediario) {
        html += `
            <div style="padding:15px; border-bottom:1px solid #eee;">
                <div style="font-weight:bold; font-size:16px;">${itemAtualConfig.nome}</div>
            </div>

            ${itemAtualConfig.adicionais?.length > 0 ? `
                <div id="btn-toggle-adicionais" 
                     onclick="const lista = document.getElementById('secao-adicionais-oculta'); lista.style.display = (lista.style.display === 'none') ? 'block' : 'none';"
                     style="margin: 15px; padding: 15px; border: 1px solid #e2e2e2; background: #fdfdfd; color: #333; text-align: center; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-plus" style="color: var(--ifood-red);"></i> 
                    ADICIONAR EXTRAS
                </div>
                
                <div id="secao-adicionais-oculta" style="display: none;">
                    <div style="padding:12px; background:#f9f9f9; font-size:12px; font-weight:700;">ADICIONAIS:</div>
                    ${itemAtualConfig.adicionais.map((a, i) => `
                        <label style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                            <input type="checkbox" name="adicional" value="${i}"> 
                            <div style="margin-left:10px; flex:1;">${a.nome}</div> 
                            <div style="color:var(--ifood-red);">+ R$ ${a.preco}</div>
                        </label>`).join('')}
                </div>
            ` : ''}`;
    } else {
        
        // Layout para Montagem do Zero (Botão MONTAR) - Mantém tudo visível como você pediu
        if (itemAtualConfig.variacoes?.length > 0) {
            html += `<div style="padding:12px; background:#f9f9f9; font-size:12px; font-weight:700;">ESCOLHA UMA OPÇÃO:</div>`;
            itemAtualConfig.variacoes.forEach((v, i) => {
                html += `<label style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #eee;"><input type="radio" name="variacao" value="${i}" ${i===0?'checked':''}> <div style="margin-left:10px; flex:1;">${v.nome}</div> <div style="color:var(--ifood-red);">+ R$ ${v.preco}</div></label>`;
            });
        }
        if (itemAtualConfig.adicionais?.length > 0) {
            html += `<div style="padding:12px; background:#f9f9f9; font-size:12px; font-weight:700;">ADICIONAIS:</div>`;
            itemAtualConfig.adicionais.forEach((a, i) => {
                html += `<label style="display:flex; align-items:center; padding:15px; border-bottom:1px solid #eee;"><input type="checkbox" name="adicional" value="${i}"> <div style="margin-left:10px; flex:1;">${a.nome}</div> <div style="color:var(--ifood-red);">+ R$ ${a.preco}</div></label>`;
            });
        }
    }

    content.innerHTML = html;

    // Função interna para atualizar o preço em tempo real
    const atualizarPrecoModalLocal = () => {
        let precoBaseStr = itemAtualConfig.isMontarGlobal ? "0,00" : (itemAtualConfig.preco || "0,00");
        let total = parseFloat(precoBaseStr.toString().replace(',', '.')) || 0;
        
        const varSel = document.querySelector('input[name="variacao"]:checked');
        if (varSel && itemAtualConfig.variacoes) {
            let vPreco = itemAtualConfig.variacoes[varSel.value].preco.toString().replace(',', '.');
            total += parseFloat(vPreco) || 0;
        }

        document.querySelectorAll('input[name="adicional"]:checked').forEach(cb => {
            if (itemAtualConfig.adicionais && itemAtualConfig.adicionais[cb.value]) {
                let aPreco = itemAtualConfig.adicionais[cb.value].preco.toString().replace(',', '.');
                total += parseFloat(aPreco) || 0;
            }
        });

        const btn = document.getElementById('btnConfirmarConfig');
        if (btn) btn.innerText = `Confirmar - R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    // Adiciona o evento de escuta nos inputs para atualizar o preço
    content.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', atualizarPrecoModalLocal);
    });

    atualizarPrecoModalLocal();
    document.getElementById('modalComida').style.bottom = '0';
    document.getElementById('overlayComida').style.display = 'block';

    // Lógica do botão de confirmação (Carrinho)
    document.getElementById('btnConfirmarConfig').onclick = () => {
        let totalFinal = parseFloat((itemAtualConfig.isMontarGlobal ? "0,00" : itemAtualConfig.preco).toString().replace(',','.'));
        let detalhesPedido = [];
        const varSel = document.querySelector('input[name="variacao"]:checked');
        
        if(varSel) {
            const v = itemAtualConfig.variacoes[varSel.value];
            totalFinal += parseFloat(v.preco.toString().replace(',','.'));
            detalhesPedido.push(`Opção: ${v.nome}`);
        }
        
        const adds = [];
        document.querySelectorAll('input[name="adicional"]:checked').forEach(cb => {
            const a = itemAtualConfig.adicionais[cb.value];
            totalFinal += parseFloat(a.preco.toString().replace(',','.'));
            adds.push(a.nome);
        });
        
        if(adds.length > 0) detalhesPedido.push(`Adicionais: ${adds.join(', ')}`);
        
        const obs = document.getElementById('gourmet-obs').value;
        if(obs) detalhesPedido.push(`Obs: ${obs}`);

        const configTexto = detalhesPedido.length > 0 ? ` | Escolhas: ${detalhesPedido.join(' | ')}` : "";
        const descricaoFinal = (itemAtualConfig.descricao || "") + configTexto;

        window.adicionarAoCarrinho(
            itemAtualConfig.id, 
            itemAtualConfig.nome, 
            totalFinal.toFixed(2).replace('.', ','), 
            itemAtualConfig.owner, 
            itemAtualConfig.whatsapp, 
            otimizarURL(itemAtualConfig.foto ? (Array.isArray(itemAtualConfig.foto) ? itemAtualConfig.foto[0] : itemAtualConfig.foto) : lojistaInfoCache.fotoPerfilComida, 100),
            gerarLinkDestaque(itemAtualConfig.id),
            descricaoFinal
        );
        
        document.getElementById('gourmet-obs').value = '';
        window.fecharModalComida();
    };
}

window.tratarBotaoAdicionar = (id, nome, preco, owner, whatsapp, imagem, link, desc) => {
    const adicionaisKey = `adic_${id}`;
    const adicionaisProduto = window[adicionaisKey] || [];
    
    if (adicionaisProduto.length > 0) {
        const modal = document.getElementById('modalComida');
        const overlay = document.getElementById('overlayComida');
        document.getElementById('modalNome').innerText = nome;
        const descModal = document.getElementById('texto-descricao-gourmet');
        if(descModal) descModal.innerText = desc || '';

        let selecionados = {};
        const precoBase = parseFloat(preco) || 0;

        function atualizarBotaoConfirmar() {
            const extras = Object.values(selecionados);
            const totalExtras = extras.reduce((sum, e) => sum + e.preco, 0);
            const totalFinal = (precoBase + totalExtras).toFixed(2).replace('.', ',');
            document.getElementById('btnConfirmarConfig').innerText = `CONFIRMAR — R$ ${totalFinal}`;
        }

        document.getElementById('modalContent').innerHTML = `
            <div class="config-section-title" style="padding:12px 15px; background:#f9f9f9; font-size:12px; font-weight:700;">Adicionais opcionais</div>
            ${adicionaisProduto.map((a, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border-bottom:1px solid #f2f2f2; cursor:pointer;" onclick="toggleAdicionalCartao(${i}, '${a.nome}', '${a.preco}')">
                    <div>
                        <div style="font-size:14px; font-weight:500;">${a.nome}</div>
                        <div style="font-size:13px; color:#666;">${parseFloat(a.preco) > 0 ? '+ R$ ' + parseFloat(a.preco).toFixed(2) : 'Grátis'}</div>
                    </div>
                    <div id="check-cartao-${i}" style="width:22px; height:22px; border-radius:50%; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; font-size:12px; color:white;"></div>
                </div>
            `).join('')}
        `;

        window.toggleAdicionalCartao = (i, nome, preco) => {
            const check = document.getElementById(`check-cartao-${i}`);
            if(selecionados[i]) {
                delete selecionados[i];
                check.style.background = '';
                check.style.borderColor = '#ddd';
                check.innerText = '';
            } else {
                selecionados[i] = { nome, preco: parseFloat(preco) || 0 };
                check.style.background = '#ea1d2c';
                check.style.borderColor = '#ea1d2c';
                check.innerText = '✓';
            }
            atualizarBotaoConfirmar();
        };

        atualizarBotaoConfirmar();

        document.getElementById('btnConfirmarConfig').onclick = () => {
            const obs = document.getElementById('gourmet-obs')?.value || '';
            const extras = Object.values(selecionados);
            const totalExtras = extras.reduce((sum, e) => sum + e.preco, 0);
            const totalFinal = (precoBase + totalExtras).toFixed(2);
            const nomeFinal = extras.length > 0 ? `${nome} (+${extras.map(e => e.nome).join(', ')})` : nome;
            const descFinal = obs ? `${desc} | Obs: ${obs}` : desc;
            window.adicionarAoCarrinho(id, nomeFinal, totalFinal, owner, whatsapp, imagem, link, descFinal);
            window.fecharModalComida();
        };

        overlay.style.display = 'block';
        modal.style.bottom = '0';

    } else {
        window.abrirConfigComida(id, false, true);
    }
};

window.toggleMenuDenuncia = (event, id) => {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    /* Fecha qualquer outro menu flutuante que possa estar aberto em paralelo */
    document.querySelectorAll('.menu-flutuante-produto').forEach(menu => {
        if(menu.id !== `menu-${id}`) {
            menu.style.display = 'none';
        }
    });

    const menu = document.getElementById(`menu-${id}`);
    if(menu) {
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
        }
    }
};

window.denunciarProduto = async (produtoId, nomeProduto) => {
    const confirmar = confirm(
        `Deseja denunciar o produto "${nomeProduto}"?`
    );

    if(!confirmar) return;

    try {
        /* Salva a denúncia estruturada de forma nativa na coleção "denuncias" no Firestore */
        await addDoc(collection(db, "denuncias"), {
            produtoId: produtoId || "",
            nomeProduto: nomeProduto || "",
            lojistaId: lojistaId || "",
            denunciante: "anonimo",
            data: new Date().toISOString(),
            status: "pendente"
        });

        alert('Denúncia enviada com sucesso.');

        /* Oculta os menus após a confirmação bem-sucedida */
        document.querySelectorAll('.menu-flutuante-produto').forEach(menu => {
            menu.style.display = 'none';
        });

    } catch(e) {
        console.error("Erro ao enviar denúncia para o Firestore: ", e);
        alert('Erro ao enviar denúncia.');
    }
};

document.addEventListener('click', () => {

    document.querySelectorAll('.menu-flutuante-produto').forEach(menu => {
        menu.style.display = 'none';
    });

});

init();

