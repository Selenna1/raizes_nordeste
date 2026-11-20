# Rede Raízes do Nordeste — API

## 1. Apresentação do projeto
A Rede Raízes do Nordeste é um sistema desenvolvido como projeto acadêmico da disciplina de Back-End. Seu objetivo é oferecer uma API REST para gerenciar as operações de uma rede de estabelecimentos, incluindo unidades, produtos, estoque, clientes, pedidos, pagamentos e programa de fidelidade.
A aplicação foi desenvolvida utilizando Node.js, Express e PostgreSQL, com autenticação por JWT e controle de acesso baseado em perfis de usuário.

## 2. Tecnologias utilizadas
- **Node.js:** ambiente de execução JavaScript no servidor.
- **Express:** framework utilizado para criação das rotas e gerenciamento das requisições HTTP.
- **PostgreSQL:** sistema gerenciador de banco de dados relacional.
- **JavaScript:** linguagem de programação utilizada no desenvolvimento da API.
- **JWT (JSON Web Token):** utilizado na autenticação dos usuários.
- **bcrypt:** utilizado para gerar hashes das senhas.
- **Swagger / OpenAPI:** utilizado para documentar e consultar os endpoints da API.
- **Postman:** utilizado para realizar testes das rotas e validar as respostas da aplicação.

## 3. Funcionalidades da API
A API disponibiliza as seguintes funcionalidades:
- **Autenticação:** cadastro e login de usuários, com autenticação por token JWT.
- **Usuários:** gerenciamento de dados dos usuários e controle de acesso por perfil.
- **Unidades:** cadastro, consulta, atualização e exclusão de unidades.
- **Produtos:** cadastro, consulta, atualização e exclusão de produtos.
- **Estoque:** cadastro, consulta e atualização das quantidades de produtos por unidade.
- **Pedidos:** criação e consulta de pedidos, inclusão de itens e cálculo automático do valor total.
- **Pagamentos:** simulação de pagamentos aprovados e recusados.
- **Status dos pedidos:** atualização do andamento dos pedidos.
- **Fidelidade:** consulta de informações do programa de fidelidade e gerenciamento do consentimento do cliente.
- **Auditoria:** registro de alterações de status dos pedidos.

## 4. Organização do projeto
O projeto está organizado em pastas para separar os arquivos da API, a conexão com o banco de dados e os recursos de documentação e testes.
```text
raizes_nordeste/
├── database/
│   └── migrations/
│       └── 001_criar_tabelas.sql
├── src/
│   ├── api/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── app.js
│   ├── infrastructure/
│   │   └── database.js
│   ├── criar-admin.js
│   ├── criar-atendente-teste.js
│   ├── server.js
│   ├── swagger.js
│   └── teste-conexao.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── Rede Raízes do Nordeste - API.postman_collection.json
```
Descrição dos principais diretórios e arquivos:
- **database/migrations:** contém o arquivo de criação e estruturação das tabelas do banco de dados.
- **src/api:** contém a configuração da API, suas rotas e middlewares.
- **src/infrastructure:** contém recursos de infraestrutura, como a conexão com o banco de dados.
- **criar-admin.js:** script para cadastrar o usuário administrador.
- **criar-atendente-teste.js:** script para cadastrar o usuário atendente de teste.
- **server.js:** inicia o servidor da API.
- **swagger.js:** configura a documentação da API.
- **teste-conexao.js:** permite verificar a conexão com o banco de dados.
- **.env.example:** modelo das variáveis de ambiente necessárias para executar o projeto.
- **.gitignore:** define os arquivos e pastas que não devem ser enviados ao Git.

## 5. Pré-requisitos
Para executar o projeto, é necessário ter instalado:
- **Node.js:** ambiente necessário para executar a aplicação.
- **npm:** gerenciador de pacotes utilizado para instalar as dependências.
- **PostgreSQL:** banco de dados utilizado pela aplicação.
- **Postman:** ferramenta recomendada para testar os endpoints da API.
Também é necessário ter acesso a um terminal para executar os comandos de instalação e inicialização.

## 6. Instalação das dependências
Primeiramente, clone o repositório do projeto:
```bash
git clone https://github.com/Selenna1/raizes_nordeste.git
```
Em seguida, acesse a pasta do projeto pelo terminal:
```bash
cd raizes_nordeste
```
Instale as dependências necessárias:
```bash
npm install
```
Esse comando instala os pacotes definidos no arquivo `package.json`, incluindo Express, PostgreSQL, JWT, bcrypt, dotenv e Nodemon.

## 7. Configuração do banco de dados
O projeto utiliza o PostgreSQL como sistema gerenciador de banco de dados.
Para configurar o banco:
1. Abra o PostgreSQL pelo pgAdmin.
2. Crie um banco de dados para o projeto.
3. Acesse o banco criado e abra o Query Tool.
4. Abra o arquivo `database/migrations/001_criar_tabelas.sql`, localizado no projeto.
5. Execute o conteúdo do arquivo para criar as tabelas e suas estruturas.
O nome do banco criado deverá ser informado na variável `DB_DATABASE` do arquivo `.env`.
As demais configurações de conexão devem utilizar os dados do PostgreSQL instalado no ambiente de execução.

## 8. Configuração das variáveis de ambiente
Na raiz do projeto, crie um arquivo chamado `.env`, utilizando o arquivo `.env.example` como modelo.
Configure as variáveis necessárias para a conexão com o banco de dados e autenticação:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_DATABASE=nome_do_banco

ADMIN_NOME=Nome do administrador
ADMIN_EMAIL=email_do_administrador
ADMIN_SENHA=senha_do_administrador

JWT_SECRET=chave_secreta_jwt

ATENDENTE_NOME=Nome do atendente
ATENDENTE_EMAIL=email_do_atendente
ATENDENTE_SENHA=senha_do_atendente
ATENDENTE_ID_UNIDADE=id_da_unidade
```
Substitua os valores de exemplo pelos dados correspondentes ao ambiente local.
**Importante:** o arquivo `.env` contém informações privadas e não deve ser enviado ao repositório. O projeto utiliza o `.gitignore` para impedir seu versionamento.

## 9. Criação dos usuários iniciais
Após configurar o banco de dados e o arquivo `.env`, os usuários iniciais podem ser criados por meio dos scripts disponíveis no projeto.
**Criar administrador:**
```bash
node src/criar-admin.js
```
O script utiliza as variáveis `ADMIN_NOME`, `ADMIN_EMAIL` e `ADMIN_SENHA`.
**Criar atendente para testes:**
```bash
node src/criar-atendente-teste.js
```
O script utiliza as variáveis `ATENDENTE_NOME`, `ATENDENTE_EMAIL`, `ATENDENTE_SENHA` e `ATENDENTE_ID_UNIDADE`.
A unidade informada para o atendente deve existir previamente no banco de dados.
As senhas são armazenadas no banco de dados em formato hash, utilizando bcrypt.
Os usuários possuem perfis de acesso diferentes, permitindo testar as permissões e restrições de cada tipo de usuário na API.
**Atenção:** execute os scripts de criação somente quando os respectivos usuários ainda não estiverem cadastrados no banco de dados.

## 10. Execução da API
Após concluir as configurações do banco de dados e das variáveis de ambiente, inicie o servidor com o comando:
```bash
npm run dev
```
O projeto utiliza o Nodemon para monitorar alterações nos arquivos durante o desenvolvimento.
Por padrão, a API é executada na porta 3000.
Para verificar se o servidor está funcionando, acesse pelo navegador:
```text
http://localhost:3000
```
A resposta esperada é uma mensagem informando que a API Rede Raízes do Nordeste está funcionando.

## 11. Documentação da API (Swagger)
A documentação dos endpoints foi desenvolvida utilizando Swagger com o padrão OpenAPI.
Com o servidor em execução, a documentação pode ser acessada pelo navegador no endereço:
```text
http://localhost:3000/api-docs
```
Por meio dessa interface, é possível consultar as rotas disponíveis, visualizar os parâmetros, verificar os formatos das requisições e respostas e realizar chamadas aos endpoints documentados.
**Observação:** o Swagger é disponibilizado localmente. Para acessá-lo, é necessário configurar e iniciar a API conforme as instruções deste README.

## 12. Testes com Postman
O projeto possui uma coleção do Postman com requisições organizadas por funcionalidades e cenários de erro.
**Arquivo da coleção:**
`Rede Raízes do Nordeste - API.postman_collection.json`
O arquivo está localizado na raiz do repositório.
Para executar os testes:
1. Abra o Postman.
2. Clique em **Import**.
3. Selecione o arquivo JSON da coleção, localizado na raiz do projeto.
4. Inicie o servidor da API.
5. Execute primeiro a requisição de login para obter um token de autenticação.
6. Utilize o token correspondente ao perfil de usuário nos campos de variáveis utilizados pelas requisições protegidas.
A coleção contempla testes de autenticação, unidades, produtos, estoque, pedidos, pagamentos e cenários de erro.
**Observação:** algumas requisições dependem de registros existentes no banco de dados e de tokens de autenticação. Para testar as permissões, utilize tokens de usuários com os respectivos perfis de acesso, como ADMIN e ATENDENTE.

## 13. Links do projeto
- **Repositório GitHub:** https://github.com/Selenna1/raizes_nordeste
- **Documentação Swagger:** http://localhost:3000/api-docs (acesso local, após iniciar a API).
- **Coleção Postman:** disponível no arquivo `Rede Raízes do Nordeste - API.postman_collection.json`, localizado na raiz do repositório.