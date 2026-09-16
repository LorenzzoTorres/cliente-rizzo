# Cliente Rizzo

Sistema de cadastro de clientes para uso do TI da Rizzo.

## Fluxo

TI → WhatsApp → gera link único → envia pelo WhatsApp → cliente preenche cadastro → SQLite salva os dados.

## Estrutura

```text
Cliente/
├── public/
│   ├── index.html
│   ├── cadastro.html
│   ├── link-invalido.html
│   ├── link-utilizado.html
│   ├── style.css
│   ├── script.js
│   ├── cadastro.js
│   └── logo-rizzo.png
├── server.js
├── package.json
├── package-lock.json
└── banco.db
```

## Rodar localmente

```bash
npm install
node server.js
```

Abra:

```text
http://localhost:3000
```

## URL pública

Defina `BASE_URL` no ambiente da hospedagem:

```text
BASE_URL=https://seu-endereco-publico
```

O servidor usa `BASE_URL` para montar os links dos clientes.

## Banco

O SQLite fica no arquivo `banco.db`. A hospedagem precisa oferecer armazenamento persistente para que os dados não sejam apagados em reinicializações/deploys.
