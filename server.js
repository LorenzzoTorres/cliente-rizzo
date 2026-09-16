const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const app = express();

// ======================================================
// CONFIGURAÇÃO
// ======================================================

// A hospedagem define a porta automaticamente.
// Localmente continua funcionando na porta 3000.
const PORT = process.env.PORT || 3000;

// URL pública do sistema.
// Na hospedagem vamos configurar essa variável.
const PUBLIC_URL =
    process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// Caminho do banco.
// Em hospedagem podemos apontar para um Volume persistente.
const DB_PATH =
    process.env.DB_PATH || path.join(__dirname, "banco.db");


// ======================================================
// BANCO DE DADOS
// ======================================================

const db = new sqlite3.Database(
    DB_PATH,
    (erro) => {

        if (erro) {

            console.error(
                "Erro ao conectar ao banco:",
                erro
            );

        } else {

            console.log(
                "Banco de dados conectado."
            );

            console.log(
                `Banco: ${DB_PATH}`
            );

        }

    }
);


// ======================================================
// FUNÇÕES DO BANCO
// ======================================================

function adicionarColunaSeNaoExistir(
    tabela,
    coluna,
    definicao
) {

    return new Promise((resolve) => {

        db.all(
            `PRAGMA table_info(${tabela})`,
            [],
            (erro, colunas) => {

                if (erro) {

                    console.error(erro);

                    resolve();

                    return;
                }


                const existe =
                    colunas.some(
                        item => item.name === coluna
                    );


                if (existe) {

                    resolve();

                    return;
                }


                db.run(
                    `ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`,
                    [],
                    (erroAlteracao) => {

                        if (erroAlteracao) {

                            console.error(
                                `Erro adicionando coluna ${coluna}:`,
                                erroAlteracao
                            );

                        }

                        resolve();

                    }
                );

            }
        );

    });

}


// ======================================================
// INICIALIZAR BANCO
// ======================================================

async function inicializarBanco() {

    // ==================================================
    // TABELA DE CLIENTES
    // ==================================================

    await new Promise((resolve) => {

        db.run(
            `
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
            `,
            (erro) => {

                if (erro) {

                    console.error(
                        "Erro criando tabela clientes:",
                        erro
                    );

                }

                resolve();

            }
        );

    });


    // ==================================================
    // COMPATIBILIDADE COM BANCO ANTERIOR
    // ==================================================

    await adicionarColunaSeNaoExistir(
        "clientes",
        "token",
        "TEXT"
    );


    await adicionarColunaSeNaoExistir(
        "clientes",
        "link_id",
        "INTEGER"
    );


    // ==================================================
    // TABELA DE LINKS
    // ==================================================

    await new Promise((resolve) => {

        db.run(
            `
            CREATE TABLE IF NOT EXISTS links_cadastro (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                token TEXT NOT NULL UNIQUE,

                nome_referencia TEXT,

                telefone TEXT,

                status TEXT DEFAULT 'aguardando',

                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

                utilizado_em DATETIME

            )
            `,
            (erro) => {

                if (erro) {

                    console.error(
                        "Erro criando tabela links:",
                        erro
                    );

                }

                resolve();

            }
        );

    });


    console.log(
        "Banco de dados pronto."
    );

}


// ======================================================
// MIDDLEWARES
// ======================================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ======================================================
// ARQUIVOS DO SITE
// ======================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ======================================================
// HEALTH CHECK
// ======================================================

// Usado pela hospedagem para verificar
// se o servidor está funcionando.

app.get(
    "/health",
    (req, res) => {

        res.json({

            sucesso: true,

            sistema: "Rizzo TI - Central de Cadastros",

            status: "online",

            horario: new Date().toISOString()

        });

    }
);


// ======================================================
// PÁGINA DE CADASTRO POR TOKEN
// ======================================================

app.get(
    "/c/:token",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// ======================================================
// API - VALIDAR LINK
// ======================================================

app.get(
    "/api/links/:token",
    (req, res) => {

        const token =
            req.params.token;


        db.get(
            `
            SELECT

                id,

                token,

                nome_referencia,

                telefone,

                status,

                criado_em,

                utilizado_em

            FROM links_cadastro

            WHERE token = ?

            `,
            [token],
            (erro, link) => {

                if (erro) {

                    console.error(erro);

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Erro ao verificar o link."

                    });

                }


                if (!link) {

                    return res.status(404).json({

                        sucesso: false,

                        mensagem:
                            "Este link de cadastro não existe."

                    });

                }


                if (
                    link.status === "utilizado"
                ) {

                    return res.status(410).json({

                        sucesso: false,

                        mensagem:
                            "Este link de cadastro já foi utilizado."

                    });

                }


                res.json({

                    sucesso: true,

                    link

                });

            }
        );

    }
);


// ======================================================
// API - GERAR LINK
// ======================================================

app.post(
    "/api/links",
    (req, res) => {

        const {

            nome_referencia,

            telefone

        } = req.body;


        // ==================================================
        // GERAR TOKEN SEGURO
        // ==================================================

        const token =
            crypto
                .randomBytes(24)
                .toString("hex");


        db.run(
            `
            INSERT INTO links_cadastro (

                token,

                nome_referencia,

                telefone,

                status

            )

            VALUES (

                ?,

                ?,

                ?,

                'aguardando'

            )
            `,
            [

                token,

                nome_referencia || "",

                telefone || ""

            ],
            function (erro) {

                if (erro) {

                    console.error(
                        "Erro criando link:",
                        erro
                    );

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Não foi possível gerar o link."

                    });

                }


                // ==================================================
                // LINK PÚBLICO
                // ==================================================

                const link =
                    `${PUBLIC_URL}/c/${token}`;


                res.json({

                    sucesso: true,

                    id: this.lastID,

                    token,

                    link

                });

            }
        );

    }
);


// ======================================================
// API - LISTAR LINKS
// ======================================================

app.get(
    "/api/links",
    (req, res) => {

        db.all(
            `
            SELECT *

            FROM links_cadastro

            ORDER BY id DESC

            `,
            [],
            (erro, links) => {

                if (erro) {

                    console.error(erro);

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Erro ao carregar links."

                    });

                }


                res.json({

                    sucesso: true,

                    links

                });

            }
        );

    }
);


// ======================================================
// API - CADASTRAR CLIENTE
// ======================================================

app.post(
    "/api/clientes",
    (req, res) => {

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

            estado_entrega,

            token

        } = req.body;


        // ==================================================
        // VALIDAR CAMPOS OBRIGATÓRIOS
        // ==================================================

        if (

            !nome ||

            !cpf_cnpj ||

            !telefone ||

            !endereco ||

            !cidade ||

            !cep ||

            !estado

        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Preencha todos os campos obrigatórios."

            });

        }


        // ==================================================
        // SALVAR CLIENTE
        // ==================================================

        function salvarCliente(
            linkId = null
        ) {

            const sql = `
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

                    estado_entrega,

                    token,

                    link_id

                )

                VALUES (

                    ?,
                    ?,
                    ?,

                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,

                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,

                    ?,
                    ?

                )
            `;


            const valores = [

                nome,

                cpf_cnpj,

                telefone,

                endereco,

                numero || "",

                complemento || "",

                bairro || "",

                cidade,

                cep,

                estado,

                endereco_entrega || "",

                numero_entrega || "",

                complemento_entrega || "",

                bairro_entrega || "",

                cidade_entrega || "",

                cep_entrega || "",

                estado_entrega || "",

                token || null,

                linkId

            ];


            db.run(
                sql,
                valores,
                function (erro) {

                    if (erro) {

                        console.error(
                            "Erro ao salvar cliente:",
                            erro
                        );

                        return res.status(500).json({

                            sucesso: false,

                            mensagem:
                                "Erro ao salvar o cadastro."

                        });

                    }


                    // ==================================================
                    // MARCAR LINK COMO UTILIZADO
                    // ==================================================

                    if (linkId) {

                        db.run(
                            `
                            UPDATE links_cadastro

                            SET

                                status = 'utilizado',

                                utilizado_em =
                                    CURRENT_TIMESTAMP

                            WHERE id = ?

                            `,
                            [linkId],
                            (erroUpdate) => {

                                if (erroUpdate) {

                                    console.error(
                                        "Erro atualizando link:",
                                        erroUpdate
                                    );

                                }

                            }
                        );

                    }


                    console.log(
                        `Novo cliente cadastrado: ${nome}`
                    );


                    res.json({

                        sucesso: true,

                        mensagem:
                            "Cadastro realizado com sucesso!",

                        id: this.lastID

                    });

                }
            );

        }


        // ==================================================
        // CADASTRO POR LINK
        // ==================================================

        if (token) {

            db.get(
                `
                SELECT *

                FROM links_cadastro

                WHERE token = ?

                `,
                [token],
                (erro, link) => {

                    if (erro) {

                        console.error(erro);

                        return res.status(500).json({

                            sucesso: false,

                            mensagem:
                                "Erro ao verificar o link."

                        });

                    }


                    if (!link) {

                        return res.status(404).json({

                            sucesso: false,

                            mensagem:
                                "Link de cadastro inválido."

                        });

                    }


                    if (
                        link.status === "utilizado"
                    ) {

                        return res.status(410).json({

                            sucesso: false,

                            mensagem:
                                "Este link já foi utilizado."

                        });

                    }


                    salvarCliente(
                        link.id
                    );

                }
            );


            return;

        }


        // ==================================================
        // CADASTRO NORMAL
        // ==================================================

        salvarCliente();

    }
);


// ======================================================
// API - LISTAR CLIENTES
// ======================================================

app.get(
    "/api/clientes",
    (req, res) => {

        db.all(
            `
            SELECT *

            FROM clientes

            ORDER BY id DESC

            `,
            [],
            (erro, clientes) => {

                if (erro) {

                    console.error(erro);

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Erro ao carregar cadastros."

                    });

                }


                res.json({

                    sucesso: true,

                    clientes

                });

            }
        );

    }
);


// ======================================================
// API - BUSCAR CLIENTE
// ======================================================

app.get(
    "/api/clientes/:id",
    (req, res) => {

        const id =
            req.params.id;


        db.get(
            `
            SELECT *

            FROM clientes

            WHERE id = ?

            `,
            [id],
            (erro, cliente) => {

                if (erro) {

                    console.error(erro);

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Erro ao buscar cadastro."

                    });

                }


                if (!cliente) {

                    return res.status(404).json({

                        sucesso: false,

                        mensagem:
                            "Cadastro não encontrado."

                    });

                }


                res.json({

                    sucesso: true,

                    cliente

                });

            }
        );

    }
);


// ======================================================
// API - EXCLUIR CLIENTE
// ======================================================

app.delete(
    "/api/clientes/:id",
    (req, res) => {

        const id =
            req.params.id;


        db.run(
            `
            DELETE FROM clientes

            WHERE id = ?

            `,
            [id],
            function (erro) {

                if (erro) {

                    console.error(erro);

                    return res.status(500).json({

                        sucesso: false,

                        mensagem:
                            "Erro ao excluir cadastro."

                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({

                        sucesso: false,

                        mensagem:
                            "Cadastro não encontrado."

                    });

                }


                res.json({

                    sucesso: true,

                    mensagem:
                        "Cadastro excluído."

                });

            }
        );

    }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

inicializarBanco()

    .then(() => {

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log("");

                console.log(
                    "========================================"
                );

                console.log(
                    " RIZZO TI - CENTRAL DE CADASTROS"
                );

                console.log(
                    "========================================"
                );

                console.log("");

                console.log(
                    `Sistema: ${PUBLIC_URL}`
                );

                console.log(
                    `Painel: ${PUBLIC_URL}/painel.html`
                );

                console.log("");

                console.log(
                    `Porta: ${PORT}`
                );

                console.log(
                    `Banco: ${DB_PATH}`
                );

                console.log("");

                console.log(
                    "Servidor iniciado."
                );

                console.log("");

            }
        );

    })
    .catch((erro) => {

        console.error(
            "Erro ao inicializar o sistema:",
            erro
        );

        process.exit(1);

    });