const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const PORT = process.env.PORT || 3000;

const PUBLIC_URL =
    process.env.PUBLIC_URL ||
    `http://localhost:${PORT}`;

const DB_PATH =
    process.env.DB_PATH ||
    path.join(__dirname, "banco.db");

const publicPath = path.join(__dirname, "public");

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicPath));

// ======================================================
// BANCO DE DADOS
// ======================================================

const db = new sqlite3.Database(DB_PATH, (err) => {

    if (err) {

        console.error(
            "Erro ao conectar ao banco:",
            err
        );

        return;
    }

    console.log("Banco de dados conectado.");
    console.log("Banco:", DB_PATH);
});

// ======================================================
// FUNÇÃO - EXECUTAR SQL
// ======================================================

function executar(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.run(
            sql,
            parametros,
            function (err) {

                if (err) {

                    reject(err);

                } else {

                    resolve({
                        id: this.lastID,
                        changes: this.changes
                    });
                }
            }
        );
    });
}

// ======================================================
// FUNÇÃO - BUSCAR UM REGISTRO
// ======================================================

function buscarUm(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.get(
            sql,
            parametros,
            (err, row) => {

                if (err) {

                    reject(err);

                } else {

                    resolve(row);
                }
            }
        );
    });
}

// ======================================================
// FUNÇÃO - BUSCAR VÁRIOS REGISTROS
// ======================================================

function buscarTodos(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.all(
            sql,
            parametros,
            (err, rows) => {

                if (err) {

                    reject(err);

                } else {

                    resolve(rows);
                }
            }
        );
    });
}

// ======================================================
// INICIALIZAÇÃO DO BANCO
// ======================================================

async function inicializarBanco() {

    await executar(`
        CREATE TABLE IF NOT EXISTS clientes (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            cpf_cnpj TEXT NOT NULL,

            telefone TEXT NOT NULL,

            endereco TEXT NOT NULL,

            numero TEXT,

            complemento TEXT,

            bairro TEXT,

            cidade TEXT NOT NULL,

            cep TEXT NOT NULL,

            estado TEXT NOT NULL,

            endereco_entrega TEXT,

            numero_entrega TEXT,

            complemento_entrega TEXT,

            bairro_entrega TEXT,

            cidade_entrega TEXT,

            cep_entrega TEXT,

            estado_entrega TEXT,

            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Banco de dados pronto.");
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {

    res.json({

        status: "ok",

        sistema:
            "Rizzo TI - Cadastro de Clientes"
    });

});

// ======================================================
// PÁGINA DE CADASTRO
// ======================================================

app.get("/cadastro", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "cadastro.html"
        )
    );

});

// ======================================================
// CADASTRAR CLIENTE
// ======================================================

app.post("/api/clientes", async (req, res) => {

    try {

        const {

            nome,

            cpf_cnpj,

            telefone,

            endereco,

            numero,

            complemento,

            bairro,

            cidade,

            cep,

            estado,

            endereco_entrega,

            numero_entrega,

            complemento_entrega,

            bairro_entrega,

            cidade_entrega,

            cep_entrega,

            estado_entrega

        } = req.body;

        // ==================================================
        // VALIDAÇÕES
        // ==================================================

        if (!nome || !String(nome).trim()) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o nome."
            });
        }

        if (
            !cpf_cnpj ||
            !String(cpf_cnpj).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o CPF/CNPJ."
            });
        }

        if (
            !telefone ||
            !String(telefone).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o telefone."
            });
        }

        if (
            !endereco ||
            !String(endereco).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o endereço."
            });
        }

        if (
            !cidade ||
            !String(cidade).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe a cidade."
            });
        }

        if (
            !cep ||
            !String(cep).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o CEP."
            });
        }

        if (
            !estado ||
            !String(estado).trim()
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Informe o estado."
            });
        }

        // ==================================================
        // SALVAR NO BANCO
        // ==================================================

        const resultado = await executar(

            `
            INSERT INTO clientes (

                nome,

                cpf_cnpj,

                telefone,

                endereco,

                numero,

                complemento,

                bairro,

                cidade,

                cep,

                estado,

                endereco_entrega,

                numero_entrega,

                complemento_entrega,

                bairro_entrega,

                cidade_entrega,

                cep_entrega,

                estado_entrega

            )

            VALUES (

                ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?,

                ?, ?, ?, ?, ?, ?, ?

            )
            `,

            [

                String(nome).trim(),

                String(cpf_cnpj).trim(),

                String(telefone).trim(),

                String(endereco).trim(),

                numero || "",

                complemento || "",

                bairro || "",

                String(cidade).trim(),

                String(cep).trim(),

                String(estado).trim(),

                endereco_entrega || "",

                numero_entrega || "",

                complemento_entrega || "",

                bairro_entrega || "",

                cidade_entrega || "",

                cep_entrega || "",

                estado_entrega || ""
            ]
        );

        console.log(
            `Novo cadastro recebido. ID: ${resultado.id}`
        );

        // ==================================================
        // RESPOSTA PARA O CLIENTE
        // ==================================================

        res.json({

            sucesso: true,

            mensagem:
                "Cadastro enviado com sucesso! Obrigado.",

            id: resultado.id

        });

    } catch (erro) {

        console.error(
            "Erro ao cadastrar cliente:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Não foi possível salvar o cadastro. Tente novamente."

        });
    }

});

// ======================================================
// LISTAR CLIENTES
// ======================================================

app.get("/api/clientes", async (req, res) => {

    try {

        const clientes = await buscarTodos(`

            SELECT *

            FROM clientes

            ORDER BY id DESC

        `);

        res.json({

            sucesso: true,

            clientes

        });

    } catch (erro) {

        console.error(
            "Erro ao listar clientes:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao carregar os cadastros."

        });
    }

});

// ======================================================
// BUSCAR CLIENTE POR ID
// ======================================================

app.get("/api/clientes/:id", async (req, res) => {

    try {

        const cliente = await buscarUm(

            `

            SELECT *

            FROM clientes

            WHERE id = ?

            `,

            [req.params.id]

        );

        if (!cliente) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        res.json({

            sucesso: true,

            cliente

        });

    } catch (erro) {

        console.error(
            "Erro ao buscar cliente:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao buscar cliente."

        });
    }

});

// ======================================================
// EXCLUIR CLIENTE
// ======================================================

app.delete("/api/clientes/:id", async (req, res) => {

    try {

        const resultado = await executar(

            `

            DELETE FROM clientes

            WHERE id = ?

            `,

            [req.params.id]

        );

        if (resultado.changes === 0) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        res.json({

            sucesso: true,

            mensagem:
                "Cadastro excluído com sucesso."

        });

    } catch (erro) {

        console.error(
            "Erro ao excluir cliente:",
            erro
        );

        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao excluir cadastro."

        });
    }

});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

inicializarBanco()

    .then(() => {

        app.listen(

            PORT,

            "0.0.0.0",

            () => {

                console.log(
                    "========================================"
                );

                console.log(
                    " RIZZO TI - CADASTRO DE CLIENTES"
                );

                console.log(
                    "========================================"
                );

                console.log(
                    `Sistema: ${PUBLIC_URL}`
                );

                console.log(
                    `Cadastro: ${PUBLIC_URL}/cadastro.html`
                );

                console.log(
                    `Central TI: ${PUBLIC_URL}/painel.html`
                );

                console.log(
                    `Porta: ${PORT}`
                );

                console.log(
                    `Banco: ${DB_PATH}`
                );

                console.log(
                    "========================================"
                );

            }

        );

    })

    .catch((erro) => {

        console.error(
            "Não foi possível iniciar o servidor:"
        );

        console.error(erro);

        process.exit(1);

    });