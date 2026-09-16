const linkForm = document.getElementById("linkForm");

if (linkForm) {
    const whatsappInput = document.getElementById("whatsapp");
    const gerarBtn = document.getElementById("gerarBtn");
    const resultado = document.getElementById("resultado");
    const linkGerado = document.getElementById("linkGerado");
    const copiarBtn = document.getElementById("copiarBtn");
    const whatsappBtn = document.getElementById("whatsappBtn");
    const resultadoMensagem = document.getElementById("resultadoMensagem");

    let numeroWhatsApp = "";

    function mascaraTelefone(valor) {
        let numeros = valor.replace(/\D/g, "").slice(0, 11);

        if (numeros.length <= 10) {
            return numeros
                .replace(/^(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d)/, "$1-$2");
        }

        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    whatsappInput.addEventListener("input", () => {
        whatsappInput.value = mascaraTelefone(whatsappInput.value);
    });

    linkForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        gerarBtn.disabled = true;
        gerarBtn.textContent = "Gerando...";
        resultadoMensagem.textContent = "";
        resultadoMensagem.className = "status";

        try {
            const resposta = await fetch("/api/links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    whatsapp: whatsappInput.value
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(dados.mensagem || "Não foi possível gerar o link.");
            }

            numeroWhatsApp = dados.whatsapp;
            linkGerado.value = dados.link;
            resultado.classList.remove("hidden");

            resultadoMensagem.textContent = "Link pronto para enviar ao cliente.";
            resultadoMensagem.classList.add("success");
        } catch (erro) {
            resultadoMensagem.textContent = erro.message;
            resultadoMensagem.classList.add("error");
        } finally {
            gerarBtn.disabled = false;
            gerarBtn.textContent = "Gerar link";
        }
    });

    copiarBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(linkGerado.value);
            copiarBtn.textContent = "Copiado!";
            setTimeout(() => {
                copiarBtn.textContent = "Copiar link";
            }, 1500);
        } catch {
            linkGerado.select();
            document.execCommand("copy");
            copiarBtn.textContent = "Copiado!";
            setTimeout(() => {
                copiarBtn.textContent = "Copiar link";
            }, 1500);
        }
    });

    whatsappBtn.addEventListener("click", () => {
        const mensagem = [
            "Olá! Somos da Rizzo.",
            "",
            "Para realizar seu cadastro, acesse o link abaixo:",
            "",
            linkGerado.value,
            "",
            "Obrigado!"
        ].join("\n");

        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    });
}
