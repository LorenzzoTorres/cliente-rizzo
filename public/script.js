// ==========================================
// MÁSCARAS DE FORMATAÇÃO (CPF/CNPJ e Telefone)
// ==========================================

document.getElementById('cpf_cnpj').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, '');
    
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        v = v.substring(0, 14);
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    e.target.value = v;
});

document.getElementById('telefone').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, '').substring(0, 11);
    
    if (v.length > 2) {
        v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    }
    if (v.length > 9) {
        v = `${v.substring(0, 10)}-${v.substring(10)}`;
    }
    
    e.target.value = v;
});

// ==========================================
// BUSCA DE CEP VIA API (VIACEP)
// ==========================================

async function buscarEnderecoExato(cep, campoEnd, campoBairro, campoCidade, campoEstado, campoNum) {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const dados = await resposta.json();
            
            if (!dados.erro) {
                document.getElementById(campoEnd).value = dados.logradouro;
                document.getElementById(campoBairro).value = dados.bairro;
                document.getElementById(campoCidade).value = dados.localidade;
                document.getElementById(campoEstado).value = dados.uf;
                document.getElementById(campoNum).focus();
            } else {
                alert("CEP não encontrado.");
            }
        } catch (erro) {
            console.error("Erro ao buscar CEP:", erro);
        }
    }
}

document.getElementById('cep').addEventListener('blur', function() {
    buscarEnderecoExato(this.value, 'endereco', 'bairro', 'cidade', 'estado', 'numero');
});

document.getElementById('cep_entrega').addEventListener('blur', function() {
    buscarEnderecoExato(this.value, 'endereco_entrega', 'bairro_entrega', 'cidade_entrega', 'estado_entrega', 'numero_entrega');
});


// ==========================================
// CHECKBOX: MESMO ENDEREÇO DE ENTREGA
// ==========================================

document.getElementById('mesmoEndereco').addEventListener('change', function() {
    const divEntrega = document.getElementById('enderecoEntrega');
    
    if (this.checked) {
        divEntrega.style.display = 'none';
        
        document.getElementById('cep_entrega').value = '';
        document.getElementById('endereco_entrega').value = '';
        document.getElementById('numero_entrega').value = '';
        document.getElementById('complemento_entrega').value = '';
        document.getElementById('bairro_entrega').value = '';
        document.getElementById('cidade_entrega').value = '';
        document.getElementById('estado_entrega').value = '';
    } else {
        divEntrega.style.display = 'block';
    }
});


// ==========================================
// ENVIO DO FORMULÁRIO (POST PARA O BANCO)
// ==========================================

document.getElementById('formCliente').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    
    const btnEnviar = document.getElementById('btnEnviar');
    const divMensagem = document.getElementById('mensagem');
    
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';
    divMensagem.innerHTML = '';
    
    const formData = new FormData(this);
    const dados = Object.fromEntries(formData.entries());
    
    try {
        const resposta = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await resposta.json();
        
        if (resultado.sucesso) {
            // Esconde o formulário
            document.getElementById('telaFormulario').style.display = 'none';
            // Mostra a tela de sucesso
            document.getElementById('telaSucesso').style.display = 'block';
            // Rola a página para o topo para o cliente ver a mensagem
            window.scrollTo(0, 0);
            // Limpa o formulário por trás
            this.reset(); 
        } else {
            // Se der erro de validação, avisa
            divMensagem.innerHTML = `<p style="color: #ef4444; font-weight: bold; margin-top: 15px; text-align: center;">${resultado.mensagem}</p>`;
        }
    } catch (erro) {
        console.error("Erro no envio:", erro);
        divMensagem.innerHTML = `<p style="color: #ef4444; font-weight: bold; margin-top: 15px; text-align: center;">Erro de conexão. Tente novamente.</p>`;
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar cadastro';
    }
});