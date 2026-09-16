const form = document.getElementById("clienteForm");

if (form) {

    // ======================================================
    // ELEMENTOS DA PÁGINA
    // ======================================================

    const mesmoEndereco =
        document.getElementById("mesmoEndereco");

    const enderecoEntrega =
        document.getElementById("enderecoEntrega");

    const mensagem =
        document.getElementById("mensagem");

    const enviarBtn =
        document.getElementById("enviarBtn");

    // ======================================================
    // MÁSCARA CEP
    // ======================================================

    function mascaraCEP(valor) {

        return valor
            .replace(/\D/g, "")
            .slice(0, 8)
            .replace(/^(\d{5})(\d)/, "$1-$2");

    }

    // ======================================================
    // MÁSCARA CPF / CNPJ
    // ======================================================

    function mascaraCPFouCNPJ(valor) {

        const numeros = valor
            .replace(/\D/g, "")
            .slice(0, 14);

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

    // ======================================================
    // MÁSCARA TELEFONE
    // ======================================================

    function mascaraTelefone(valor) {

        const numeros = valor
            .replace(/\D/g, "")
            .slice(0, 11);

        if (numeros.length <= 10) {

            return numeros
                .replace(/^(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d)/, "$1-$2");

        }

        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");

    }

    // ======================================================
    // PREENCHER ENDEREÇO PELO CEP
    // ======================================================

    function preencherEndereco(prefixo, dados) {

        const endereco =
            document.getElementById(`endereco${prefixo}`);

        const bairro =
            document.getElementById(`bairro${prefixo}`);

        const cidade =
            document.getElementById(`cidade${prefixo}`);

        const estado =
            document.getElementById(`estado${prefixo}`);

        if (endereco) {
            endereco.value =
                dados.logradouro || "";
        }

        if (bairro) {
            bairro.value =
                dados.bairro || "";
        }

        if (cidade) {
            cidade.value =
                dados.localidade || "";
        }

        if (estado) {
            estado.value =
                dados.uf || "";
        }

    }

    // ======================================================
    // CONSULTAR CEP
    // ======================================================

    async function consultarCEP(campoCEP, prefixo) {

        const cep =
            campoCEP.value.replace(/\D/g, "");

        if (cep.length !== 8) {
            return;
        }

        campoCEP.disabled = true;

        try {

            const resposta = await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );

            if (!resposta.ok) {

                throw new Error(
                    "Não foi possível consultar o CEP."
                );

            }

            const dados =
                await resposta.json();

            if (dados.erro) {

                throw new Error(
                    "CEP não encontrado."
                );

            }

            preencherEndereco(
                prefixo,
                dados
            );

            mensagem.textContent = "";
            mensagem.className = "status";

        } catch (erro) {

            mensagem.textContent =
                erro.message ||
                "Erro ao consultar o CEP.";

            mensagem.className =
                "status error";

        } finally {

            campoCEP.disabled = false;

        }

    }

    // ======================================================
    // CEP PRINCIPAL
    // ======================================================

    const campoCEP =
        document.getElementById("cep");

    if (campoCEP) {

        campoCEP.addEventListener(
            "input",
            (event) => {

                event.target.value =
                    mascaraCEP(
                        event.target.value
                    );

            }
        );

        campoCEP.addEventListener(
            "blur",
            (event) => {

                consultarCEP(
                    event.target,
                    ""
                );

            }
        );

    }

    // ======================================================
    // CEP DE ENTREGA
    // ======================================================

    const campoCEPEntrega =
        document.getElementById("cep_entrega");

    if (campoCEPEntrega) {

        campoCEPEntrega.addEventListener(
            "input",
            (event) => {

                event.target.value =
                    mascaraCEP(
                        event.target.value
                    );

            }
        );

        campoCEPEntrega.addEventListener(
            "blur",
            (event) => {

                consultarCEP(
                    event.target,
                    "_entrega"
                );

            }
        );

    }

    // ======================================================
    // CPF / CNPJ
    // ======================================================

    const campoCPF =
        document.getElementById("cpf_cnpj");

    if (campoCPF) {

        campoCPF.addEventListener(
            "input",
            (event) => {

                event.target.value =
                    mascaraCPFouCNPJ(
                        event.target.value
                    );

            }
        );

    }

    // ======================================================
    // TELEFONE
    // ======================================================

    const campoTelefone =
        document.getElementById("telefone");

    if (campoTelefone) {

        campoTelefone.addEventListener(
            "input",
            (event) => {

                event.target.value =
                    mascaraTelefone(
                        event.target.value
                    );

            }
        );

    }

    // ======================================================
    // MESMO ENDEREÇO
    // ======================================================

    if (
        mesmoEndereco &&
        enderecoEntrega
    ) {

        mesmoEndereco.addEventListener(
            "change",
            () => {

                enderecoEntrega.classList.toggle(
                    "hidden",
                    mesmoEndereco.checked
                );

            }
        );

        enderecoEntrega.classList.toggle(
            "hidden",
            mesmoEndereco.checked
        );

    }

    // ======================================================
    // ENVIO DO CADASTRO
    // ======================================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            mensagem.textContent = "";
            mensagem.className = "status";

            enviarBtn.disabled = true;
            enviarBtn.textContent = "Enviando...";

            // ==================================================
            // PEGAR DADOS DO FORMULÁRIO
            // ==================================================

            const formData =
                new FormData(form);

            const dados =
                Object.fromEntries(
                    formData.entries()
                );

            // ==================================================
            // MESMO ENDEREÇO
            // ==================================================

            if (
                mesmoEndereco &&
                mesmoEndereco.checked
            ) {

                dados.endereco_entrega =
                    dados.endereco || "";

                dados.numero_entrega =
                    dados.numero || "";

                dados.complemento_entrega =
                    dados.complemento || "";

                dados.bairro_entrega =
                    dados.bairro || "";

                dados.cidade_entrega =
                    dados.cidade || "";

                dados.cep_entrega =
                    dados.cep || "";

                dados.estado_entrega =
                    dados.estado || "";

            }

            console.log(
                "Enviando cadastro:",
                dados
            );

            // ==================================================
            // ENVIAR PARA O SERVIDOR
            // ==================================================

            try {

                const resposta =
                    await fetch(
                        "/api/clientes",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(dados)
                        }
                    );

                let resultado;

                try {

                    resultado =
                        await resposta.json();

                } catch {

                    throw new Error(
                        "O servidor retornou uma resposta inválida."
                    );

                }

                // ==================================================
                // ERRO
                // ==================================================

                if (
                    !resposta.ok ||
                    !resultado.sucesso
                ) {

                    throw new Error(
                        resultado.mensagem ||
                        "Erro ao enviar cadastro."
                    );

                }

                // ==================================================
                // SUCESSO
                // ==================================================

                mensagem.textContent =
                    resultado.mensagem ||
                    "Cadastro realizado com sucesso!";

                mensagem.className =
                    "status success";

                // Desabilitar formulário

                form.querySelectorAll(
                    "input, select, textarea, button"
                ).forEach(
                    (elemento) => {

                        elemento.disabled = true;

                    }
                );

                // Rolar até a mensagem

                mensagem.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            } catch (erro) {

                console.error(
                    "Erro no cadastro:",
                    erro
                );

                mensagem.textContent =
                    erro.message ||
                    "Não foi possível enviar o cadastro.";

                mensagem.className =
                    "status error";

                enviarBtn.disabled = false;

                enviarBtn.textContent =
                    "Enviar cadastro";

            }

        }
    );

}