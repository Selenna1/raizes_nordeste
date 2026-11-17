usuarios
unidades
produtos
estoque
clientes
pedidos
itens_pedido
pagamentos
fidelidade
promocoes
movimentacoes_estoque
logs_auditoria
promocoes_produtos


Tabela: usuarios
id: INTEGER
id_unidade: INTEGER
id_cliente: INTEGER
nome: VARCHAR(100)
email: VARCHAR(150)
senha: VARCHAR(255)
perfil: VARCHAR(30)
ativo: BOOLEAN
criado_em: TIMESTAMP

Chave primária:
id

Chaves estrangeiras:
id_unidade → unidades(id)
id_cliente → clientes(id)

Campos obrigatórios:
nome
email
senha
perfil
ativo
criado_em
Restrições:
email deve ser UNIQUE
id_cliente deve ser UNIQUE
perfil deve aceitar:ADMIN, GERENTE, ATENDENTE, COZINHA, CLIENTE

Regras:
id_unidade pode ser NULL para ADMIN e CLIENTE.
GERENTE, ATENDENTE e COZINHA devem ter uma unidade vinculada.
id_cliente pode ser NULL para funcionários.
CLIENTE deve ter um cadastro vinculado em clientes.
A senha deve ser armazenada em formato de hash.

Tabela: unidades

id: INTEGER
nome: VARCHAR(100)
endereco: VARCHAR(200)
telefone: VARCHAR(20)
cidade: VARCHAR(100)
ativa: BOOLEAN

Chave primária:
id

Campos obrigatórios:
nome
cidade
ativa

Restrições:
Nenhuma restrição adicional definida.

Regras:
Cada unidade representa uma loja da Rede Raízes do Nordeste.
Uma unidade pode possuir vários funcionários, produtos em estoque e pedidos.
O campo ativa indica se a unidade está em funcionamento no sistema.


Tabela: produtos

id: INTEGER
nome: VARCHAR(100)
descricao: VARCHAR(255)
preco: NUMERIC(10,2)
categoria: VARCHAR(50)
ativo: BOOLEAN

Chave primária:
id

Campos obrigatórios:
nome
preco
ativo

Restrições:
preco deve ser maior ou igual a zero.

Regras:
Cada produto representa um item que pode ser comercializado pela rede.
O campo ativo indica se o produto está disponível para comercialização.
O produto será oferecido em uma unidade quando estiver ativo e possuir registro de estoque naquela unidade com quantidade maior que zero.


Tabela: estoque

id: INTEGER
id_unidade: INTEGER
id_produto: INTEGER
quantidade: INTEGER

Chave primária:
id

Chaves estrangeiras:
id_unidade → unidades(id)
id_produto → produtos(id)

Campos obrigatórios:
id_unidade
id_produto
quantidade

Restrições:
UNIQUE(id_unidade, id_produto)
quantidade deve ser maior ou igual a zero.

Regras:
Cada registro representa o estoque de um produto em uma unidade específica.
Um produto pode possuir registros de estoque em várias unidades.
Uma unidade não pode ter dois registros de estoque para o mesmo produto.
A quantidade indica o saldo disponível daquele produto na unidade.


Tabela: clientes

id: INTEGER
nome: VARCHAR(100)
email: VARCHAR(150)
telefone: VARCHAR(20)
criado_em: TIMESTAMP

Chave primária:
id

Campos obrigatórios:
nome
email
criado_em

Restrições:
email deve ser UNIQUE.

Regras:
Armazena os dados cadastrais dos clientes.
Cada cliente pode realizar vários pedidos.
Cada cliente pode possuir um cadastro de fidelidade.
Os dados pessoais devem ser tratados conforme as regras da LGPD.



Tabela: pedidos

id: INTEGER
id_cliente: INTEGER
id_unidade: INTEGER
canal_pedido: VARCHAR(20)
status: VARCHAR(30)
valor_total: NUMERIC(10,2)
criado_em: TIMESTAMP

Chave primária:
id

Chaves estrangeiras:
id_cliente → clientes(id)
id_unidade → unidades(id)

Campos obrigatórios:
id_unidade
canal_pedido
status
valor_total
criado_em

Restrições:
valor_total deve ser maior ou igual a zero.
canal_pedido deve aceitar:
APP, TOTEM, BALCAO, PICKUP, WEB.

status deve aceitar:
AGUARDANDO_PAGAMENTO, PAGO, EM_PREPARACAO, PRONTO, ENTREGUE, CANCELADO.

Regras:
Cada pedido pertence a uma unidade.
Um pedido pode conter vários itens.
O pedido pode estar associado a um cliente cadastrado.
O canal_pedido identifica onde o pedido foi realizado.
O status representa a etapa atual do pedido.


Tabela: itens_pedido

id: INTEGER
id_pedido: INTEGER
id_produto: INTEGER
quantidade: INTEGER
preco_unitario: NUMERIC(10,2)

Chave primária:
id

Chaves estrangeiras:
id_pedido → pedidos(id)
id_produto → produtos(id)

Campos obrigatórios:
id_pedido
id_produto
quantidade
preco_unitario

Restrições:
quantidade deve ser maior que zero.
preco_unitario deve ser maior ou igual a zero.

Regras:
Cada registro representa um produto incluído em um pedido.
Um pedido pode possuir vários itens.
O preco_unitario registra o preço do produto no momento da compra, preservando o histórico mesmo que o preço atual seja alterado.


Tabela: pagamentos

id: INTEGER
id_pedido: INTEGER
valor: NUMERIC(10,2)
metodo: VARCHAR(50)
status: VARCHAR(30)
criado_em: TIMESTAMP
referencia_gateway: VARCHAR(150)
resposta_gateway: TEXT

Chave primária:
id

Chaves estrangeiras:
id_pedido → pedidos(id)

Campos obrigatórios:
id_pedido
valor
metodo
status
criado_em

Restrições:
valor deve ser maior ou igual a zero.

status deve aceitar:
PENDENTE, APROVADO, RECUSADO, ESTORNADO.

Regras:
Cada pagamento está associado a um pedido.
O sistema registra o resultado do pagamento recebido pelo gateway externo.
referencia_gateway e resposta_gateway armazenam informações de retorno da integração.
Não armazenar dados sensíveis de cartões ou credenciais de pagamento.



Tabela: fidelidade

id: INTEGER
id_cliente: INTEGER
pontos: INTEGER
atualizado_em: TIMESTAMP
consentimento: BOOLEAN
data_consentimento: TIMESTAMP

Chave primária:
id

Chaves estrangeiras:
id_cliente → clientes(id)

Campos obrigatórios:
id_cliente
pontos
atualizado_em
consentimento

Restrições:
id_cliente deve ser UNIQUE.
pontos deve ser maior ou igual a zero.
consentimento terá valor padrão FALSE.
consentimento = FALSE exige data_consentimento NULL.
consentimento = TRUE exige data_consentimento preenchida.


Regras:
Cada cliente pode possuir um único cadastro de fidelidade.
O campo pontos armazena o saldo atual de pontos do cliente.
O consentimento registra a autorização do cliente para participar do programa.
A data_consentimento deve ser preenchida quando o consentimento for TRUE e ficar vazia quando for FALSE.



Tabela: promocoes

id: INTEGER
nome: VARCHAR(100)
descricao: VARCHAR(255)
tipo_desconto: VARCHAR(30)
valor_desconto: NUMERIC(10,2)
data_inicio: TIMESTAMP
data_fim: TIMESTAMP
ativa: BOOLEAN

Chave primária:
id

Campos obrigatórios:
nome
tipo_desconto
valor_desconto
data_inicio
data_fim
ativa

Restrições:
valor_desconto deve ser maior ou igual a zero.
tipo_desconto deve aceitar:
VALOR_FIXO, PERCENTUAL.
data_fim deve ser igual ou posterior a data_inicio.
Quando tipo_desconto for PERCENTUAL, valor_desconto não pode ultrapassar 100.

Regras:
Armazena as promoções cadastradas pela rede.
O campo ativa indica se a promoção está habilitada.
As datas definem o período de validade da promoção.



Tabela: movimentacoes_estoque
id: INTEGER
id_unidade: INTEGER
id_produto: INTEGER
id_usuario: INTEGER
id_pedido: INTEGER
tipo: VARCHAR(30)
quantidade: INTEGER
motivo: VARCHAR(255)
criado_em: TIMESTAMP

Chave primária:
id

Chaves estrangeiras:
id_unidade → unidades(id)
id_produto → produtos(id)
id_usuario → usuarios(id)
id_pedido → pedidos(id)

Campos obrigatórios:
id_unidade
id_produto
tipo
quantidade
criado_em

Restrições:
tipo deve aceitar:
ENTRADA, SAIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO.
quantidade deve ser maior que zero.

Regras:
Registra entradas, saídas e ajustes de estoque.
Cada movimentação está relacionada a uma unidade e a um produto.
id_usuario pode ficar vazio quando a movimentação for realizada automaticamente pelo sistema. Quando for uma movimentação manual, deverá identificar o usuário responsável.
id_pedido pode ficar vazio quando a movimentação não estiver relacionada a um pedido.
O campo motivo pode explicar a razão da movimentação.



Tabela: logs_auditoria
id: INTEGER
id_usuario: INTEGER
acao: VARCHAR(100)
tabela_afetada: VARCHAR(100)
id_registro: INTEGER
detalhes: TEXT
criado_em: TIMESTAMP

Chave primária:
id

Chaves estrangeiras:
id_usuario → usuarios(id)

Campos obrigatórios:
acao
tabela_afetada
criado_em

Restrições:
Nenhuma restrição adicional definida.

Regras:
Registra ações importantes realizadas no sistema.
id_usuario pode ficar vazio quando o evento for gerado automaticamente pelo sistema.
tabela_afetada identifica a tabela relacionada à ação.
id_registro identifica o registro afetado.
detalhes armazena informações complementares sobre a operação.


Tabela: promocoes_produtos
id: INTEGER
id_promocao: INTEGER
id_produto: INTEGER

Chave primária:
id

Chaves estrangeiras:
id_promocao → promocoes(id)
id_produto → produtos(id)

Campos obrigatórios:
id_promocao
id_produto

Restrições:
UNIQUE(id_promocao, id_produto).

Regras:
Relaciona as promoções aos produtos participantes.
Uma promoção pode estar associada a vários produtos.
Um produto pode participar de várias promoções.
O mesmo produto não pode ser associado duas vezes à mesma promoção.
