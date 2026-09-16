const form = document.getElementById("clienteForm");

if (form) {
    const tokenInput = document.getElementById("token");
    const token = window.location.pathname.split("/").filter(Boolean).pop();
    tokenInput.value = token || "";

    const mesmoEndereco = document.getElementById("mesmoEndereco");
    const enderecoEntrega = document.getElementById("enderecoEntrega");
    const mensagem = document.getElementById("mensagem");
    const enviarBtn = document.getElementById("enviarBtn");

    function mascaraCEP(valor) {
        return valor
            .replace(/\D/g, "")
            .slice(0, 8)
            .replace(/^(\d{5})(\d)/, "$1-$2");
    }

    function mascaraCPFouCNPJ(valor) {
        const numeros = valor.replace(/\D/g, "").slice(0, 14);

        if (numeros.length <= 11) {
            return numeros
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        }

        return numeros
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    function mascaraTelefone(valor) {
        const numeros = valor.replace(/\D/g, "").slice(0, 11);

        if (numeros.length <= 10) {
            return numeros
                .replace(/^(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d)/, "$1-$2");
        }

        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    function preencherEndereco(prefixo, dados) {
        document.getElementById(`endereco${prefixo}`).value = dados.logradouro || "";
        document.getElementById(`bairro${prefixo}`).value = dados.bairro || "";
        document.getElementById(`cidade${prefixo}`).value = dados.localidade || "";
        document.getElementById(`estado${prefixo}`).value = dados.uf || "";
    }

    async function consultarCEP(campoCEP, prefixo) {
        const cep = campoCEP.value.replace(/\D/g, "");

        if (cep.length !== 8) return;

        campoCEP.disabled = true;

        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await resposta.json();

            if (dados.erro) {
                throw new Error("CEP não encontrado.");
            }

            preencherEndereco(prefixo, dados);
        } catch (erro) {
            mensagem.textContent = erro.message;
            mensagem.className = "status error";
        } finally {
            campoCEP.disabled = false;
        }
    }

    document.getElementById("cep").addEventListener("input", (event) => {
        event.target.value = mascaraCEP(event.target.value);
    });

    document.getElementById("cep").addEventListener("blur", (event) => {
        consultarCEP(event.target, "");
    });

    document.getElementById("cep_entrega").addEventListener("input", (event) => {
        event.target.value = mascaraCEP(event.target.value);
    });

    document.getElementById("cep_entrega").addEventListener("blur", (event) => {
        consultarCEP(event.target, "_entrega");
    });

    document.getElementById("cpf_cnpj").addEventListener("input", (event) => {
        event.target.value = mascaraCPFouCNPJ(event.target.value);
    });

    document.getElementById("telefone").addEventListener("input", (event) => {
        event.target.value = mascaraTelefone(event.target.value);
    });

    mesmoEndereco.addEventListener("change", () => {
        enderecoEntrega.classList.toggle("hidden", mesmoEndereco.checked);
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        mensagem.textContent = "";
        mensagem.className = "status";
        enviarBtn.disabled = true;
        enviarBtn.textContent = "Enviando...";

        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());

        if (mesmoEndereco.checked) {
            dados.endereco_entrega = dados.endereco;
            dados.numero_entrega = dados.numero;
            dados.complemento_entrega = dados.complemento;
            dados.bairro_entrega = dados.bairro;
            dados.cidade_entrega = dados.cidade;
            dados.cep_entrega = dados.cep;
            dados.estado_entrega = dados.estado;
        }

        try {
            const resposta = await fetch("/api/clientes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem || "Erro ao enviar cadastro.");
            }

            mensagem.textContent = resultado.mensagem;
            mensagem.classList.add("success");

            form.querySelectorAll("input, button").forEach((elemento) => {
                elemento.disabled = true;
            });

            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        } catch (erro) {
            mensagem.textContent = erro.message;
            mensagem.classList.add("error");
            enviarBtn.disabled = false;
            enviarBtn.textContent = "Enviar cadastro";
        }
    });

    // Endereço de entrega inicia oculto porque "mesmo endereço" já vem marcado.
    enderecoEntrega.classList.add("hidden");
}
