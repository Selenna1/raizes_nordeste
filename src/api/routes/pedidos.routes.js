import express from 'express';
import pool from '../../infrastructure/database.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/permissao.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Consulta todos os pedidos
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: canalPedido
 *         schema:
 *           type: string
 *           enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *         required: false
 *         description: Filtra os pedidos pelo canal de origem
 *     responses:
 *       200:
 *         description: Lista de pedidos consultada com sucesso
 *       400:
 *         description: Canal de pedido inválido
 *       500:
 *         description: Erro ao consultar pedidos
 */
router.get('/', async (req, res) => {
  try {
    const { canalPedido } = req.query;
    let consulta = 'SELECT * FROM pedidos';
    const valores = [];
    if (canalPedido) {
      const canaisPermitidos = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'];
      if (!canaisPermitidos.includes(canalPedido)) {
        return res.status(400).json({
          erro: 'Canal de pedido inválido.'
        });
      }
      consulta += ' WHERE canal_pedido = $1';
      valores.push(canalPedido);
    }
    consulta += ' ORDER BY id DESC';
    const resultado = await pool.query(consulta, valores);
    res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao consultar pedidos.'
    });
  }
});

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Consulta um pedido pelo ID
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro ao consultar pedido
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao consultar pedido.'
    });
  }
});

/**
 * @swagger
 * /pedidos/{id}/itens:
 *   get:
 *     summary: Consulta os itens de um pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do pedido
 *     responses:
 *       200:
 *         description: Itens do pedido consultados com sucesso
 *       400:
 *         description: ID do pedido inválido
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro ao consultar itens do pedido
 */
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        erro: 'ID do pedido inválido.'
      });
    }
    const pedido = await pool.query(
      'SELECT id FROM pedidos WHERE id = $1',
      [id]
    );
    if (pedido.rows.length === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }
    const resultado = await pool.query(
      `SELECT
        ip.id,
        ip.id_pedido,
        ip.id_produto,
        p.nome AS produto,
        ip.quantidade,
        ip.preco_unitario
      FROM itens_pedido ip
      INNER JOIN produtos p ON p.id = ip.id_produto
      WHERE ip.id_pedido = $1
      ORDER BY ip.id`,
      [id]
    );
    res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao consultar itens do pedido.'
    });
  }
});

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Cadastra um novo pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_unidade
 *               - canal_pedido
 *             properties:
 *               id_cliente:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               id_unidade:
 *                 type: integer
 *                 example: 3
 *               canal_pedido:
 *                 type: string
 *                 enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *                 example: BALCAO
 *     responses:
 *       201:
 *         description: Pedido cadastrado com sucesso
 *       400:
 *         description: Dados obrigatórios ausentes ou canal inválido
 *       404:
 *         description: Unidade ou cliente não encontrado
 *       500:
 *         description: Erro interno ao cadastrar pedido
 */
router.post('/', async (req, res) => {
  try {
    
    const { id_cliente, id_unidade, canal_pedido } = req.body;
    // Validar campos obrigatórios
      if (!id_unidade || !canal_pedido) {
        return res.status(400).json({
          erro: 'Informe a unidade e o canal do pedido.'
        });
    }
    // Validar canal
    const canaisPermitidos = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'];
      if (!canaisPermitidos.includes(canal_pedido)) {
        return res.status(400).json({
          erro: 'Canal de pedido inválido.'
        });
    }
    // Verificar se a unidade existe
    const unidade = await pool.query(
      'SELECT id FROM unidades WHERE id = $1',
      [id_unidade]
    );
    if (unidade.rows.length === 0) {
      return res.status(404).json({
        erro: 'Unidade não encontrada.'
      });
    }
    if (id_cliente) {
      const cliente = await pool.query(
        'SELECT id FROM clientes WHERE id = $1',
        [id_cliente]
      );
      if (cliente.rows.length === 0) {
        return res.status(404).json({
          erro: 'Cliente não encontrado.'
        });
      }
    }  
    // Cadastrar pedido
    const resultado = await pool.query(
      `INSERT INTO pedidos
      (id_cliente, id_unidade, canal_pedido, status, valor_total, criado_em)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
      [
        id_cliente || null,
        id_unidade,
        canal_pedido,
        'AGUARDANDO_PAGAMENTO',
        0
      ]
    );
    res.status(201).json(resultado.rows[0]);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({
        erro: 'Erro interno ao cadastrar pedido.'
      });
  }
});



/**
 * @swagger
 * /pedidos/{id}/itens:
 *   post:
 *     summary: Adiciona um item ao pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_produto
 *               - quantidade
 *             properties:
 *               id_produto:
 *                 type: integer
 *                 example: 2
 *               quantidade:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item adicionado ao pedido com sucesso
 *       400:
 *         description: Dados inválidos ou pedido não permite novos itens
 *       404:
 *         description: Pedido ou produto não encontrado
 *       409:
 *         description: Estoque não cadastrado ou quantidade insuficiente
 *       500:
 *         description: Erro interno ao adicionar item
 */
router.post('/:id/itens', async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;
    const { id_produto, quantidade } = req.body;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        erro: 'ID do pedido inválido.'
      });
    }
    if (!Number.isInteger(Number(id_produto)) || Number(id_produto) <= 0) {
      return res.status(400).json({
        erro: 'ID do produto inválido.'
      });
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        erro: 'A quantidade deve ser um número inteiro maior que zero.'
      });
    }
    const pedido = await pool.query(
      'SELECT id, id_unidade, status FROM pedidos WHERE id = $1',
      [id]
    );
    if (pedido.rows.length === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }
    if (pedido.rows[0].status !== 'AGUARDANDO_PAGAMENTO') {
      return res.status(400).json({
        erro: 'Não é possível adicionar itens a este pedido.'
      });
    }
    const produto = await pool.query(
      'SELECT id, preco, ativo FROM produtos WHERE id = $1',
      [id_produto]
    );
    if (produto.rows.length === 0) {
      return res.status(404).json({
          erro: 'Produto não encontrado.'
      });
    }
    if (!produto.rows[0].ativo) {
      return res.status(400).json({
          erro: 'Produto está inativo e não pode ser adicionado.'
      });
    }
    conexao = await pool.connect();
    await conexao.query('BEGIN');
    const estoque = await conexao.query(
      `SELECT id, quantidade
      FROM estoque
      WHERE id_unidade = $1 AND id_produto = $2
      FOR UPDATE`,
      [pedido.rows[0].id_unidade, id_produto]
    );
    if (estoque.rows.length === 0) {
      await conexao.query('ROLLBACK');
      return res.status(409).json({
        erro: 'Estoque não cadastrado para este produto nesta unidade.'
      });
    }
    if (estoque.rows[0].quantidade < quantidade) {
      await conexao.query('ROLLBACK');
      return res.status(409).json({
        erro: 'Estoque insuficiente.'
      });
    }
    const precoUnitario = produto.rows[0].preco;
    await conexao.query(
      `UPDATE estoque
      SET quantidade = quantidade - $1
      WHERE id = $2`,
      [quantidade, estoque.rows[0].id]
    );
    const resultado = await conexao.query(
        `INSERT INTO itens_pedido
        (id_pedido, id_produto, quantidade, preco_unitario)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [id, id_produto, quantidade, precoUnitario]
    );
    await conexao.query(
      `INSERT INTO movimentacoes_estoque
      (id_unidade, id_produto, id_pedido, tipo, quantidade, motivo, criado_em)
      VALUES ($1, $2, $3, 'SAIDA', $4, $5, NOW())`,
      [
        pedido.rows[0].id_unidade,
        id_produto,
        id,
        quantidade,
        'Produto adicionado ao pedido'
      ]
    );
    await conexao.query(
      `UPDATE pedidos
      SET valor_total = (
        SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
        FROM itens_pedido
        WHERE id_pedido = $1
      )
      WHERE id = $1`,
      [id]
    );
    await conexao.query('COMMIT');
    return res.status(201).json({
      mensagem: 'Item adicionado ao pedido com sucesso.',
      item: resultado.rows[0]
    });
    } catch (erro) {
      if (conexao) {
        await conexao.query('ROLLBACK');
      }
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro interno ao adicionar item ao pedido.'
      });
    } finally {
      if (conexao) {
        conexao.release();
      }
    }   
});

/**
 * @swagger
 * /pedidos/{id}/pagamento:
 *   post:
 *     summary: Processa o pagamento simulado de um pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metodo
 *             properties:
 *               metodo:
 *                 type: string
 *                 enum: [PIX, CARTAO, DINHEIRO]
 *                 example: PIX
 *               simular_recusa:
 *                 type: boolean
 *                 example: true
 *                 description: Define se o pagamento será recusado no ambiente de testes
 *     responses:
 *       201:
 *         description: Pagamento simulado aprovado com sucesso
 *       402:
 *         description: Pagamento simulado recusado
 *       400:
 *         description: Pedido inválido, sem itens ou método inválido
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro ao processar pagamento
 */
router.post('/:id/pagamento', async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;
    const { metodo, simular_recusa } = req.body;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        erro: 'ID do pedido inválido.'
      });
    }
    const pedido = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1',
      [id]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }
    if (pedido.rows[0].status !== 'AGUARDANDO_PAGAMENTO') {
      return res.status(400).json({
        erro: 'Este pedido não está aguardando pagamento.'
      });
    }
    const itens = await pool.query(
      'SELECT id FROM itens_pedido WHERE id_pedido = $1',
      [id]
    );
    if (itens.rows.length === 0) {
      return res.status(400).json({
        erro: 'Não é possível pagar um pedido sem itens.'
      });
    }
    const metodosPermitidos = ['PIX', 'CARTAO', 'DINHEIRO'];
    if (!metodosPermitidos.includes(metodo)) {
      return res.status(400).json({
        erro: 'Método de pagamento inválido.'
      });
    }
    conexao = await pool.connect();
    await conexao.query('BEGIN');
    const statusPagamento = simular_recusa === true
      ? 'RECUSADO'
      : 'APROVADO';
    const respostaGateway = simular_recusa === true
      ? 'Pagamento recusado em ambiente de testes'
      : 'Pagamento aprovado em ambiente de testes';
    const pagamento = await conexao.query(
      `INSERT INTO pagamentos
      (id_pedido, valor, metodo, status, criado_em, referencia_gateway, resposta_gateway)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6)
      RETURNING *`,
      [
        id,
        pedido.rows[0].valor_total,
        metodo,
        statusPagamento,
        `SIMULADO-${id}`,
        respostaGateway
      ]
    );
    if (simular_recusa !== true) {
      await conexao.query(
        `UPDATE pedidos
        SET status = 'PAGO'
        WHERE id = $1`,
        [id]
      );
    }
    await conexao.query('COMMIT');
    if (simular_recusa === true) {
      return res.status(402).json({
        mensagem: 'Pagamento simulado recusado.',
        pagamento: pagamento.rows[0]
      });
    }
    return res.status(201).json({
      mensagem: 'Pagamento simulado aprovado com sucesso.',
      pagamento: pagamento.rows[0]
    });
  } catch (erro) {
    if (conexao) {
      try {
        await conexao.query('ROLLBACK');
      } catch (erroRollback) {
        console.error(erroRollback);
      }
    }
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao processar pagamento.'
    });
  }finally {
  if (conexao) {
    conexao.release();
  }
}
});


/**
 * @swagger
 * /pedidos/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [EM_PREPARACAO, PRONTO, ENTREGUE, CANCELADO]
 *           example:
 *             status: EM_PREPARACAO
 *     responses:
 *       200:
 *         description: Status do pedido atualizado com sucesso
 *       400:
 *         description: Status inválido ou transição não permitida
 *       401:
 *         description: Token de autenticação não informado ou inválido
 *       403:
 *         description: Usuário sem permissão para atualizar o status
 *       404:
 *         description: Pedido não encontrado
 *       409:
 *         description: Não foi possível devolver o produto ao estoque
 *       500:
 *         description: Erro ao atualizar status do pedido
 */
router.patch(
  '/:id/status',
  autenticar,
  permitirPerfis('ADMIN', 'GERENTE', 'ATENDENTE', 'COZINHA'),
  async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statusPermitidos = [
      'EM_PREPARACAO',
      'PRONTO',
      'ENTREGUE',
      'CANCELADO'
    ];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({
        erro: 'Status do pedido inválido.'
      });
    }
    conexao = await pool.connect();
      await conexao.query('BEGIN');
      const resultado = await conexao.query(
        'SELECT id, id_unidade, status FROM pedidos WHERE id = $1 FOR UPDATE',
        [id]
      );
    if (resultado.rows.length === 0) {
      await conexao.query('ROLLBACK');
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }
    const statusAtual = resultado.rows[0].status;
    const transicoesPermitidas = {
      PAGO: ['EM_PREPARACAO'],
      EM_PREPARACAO: ['PRONTO'],
      PRONTO: ['ENTREGUE'],
      AGUARDANDO_PAGAMENTO: ['CANCELADO']
    };
    if (!transicoesPermitidas[statusAtual]?.includes(status)) {
      await conexao.query('ROLLBACK');
      return res.status(400).json({
        erro: 'Transição de status não permitida.'
      });
    }
    if (status === 'CANCELADO') {
      const itens = await conexao.query(
        `SELECT id_produto, quantidade
        FROM itens_pedido
        WHERE id_pedido = $1`,
        [id]
      );
      for (const item of itens.rows) {
        const estoqueAtualizado = await conexao.query(
          `UPDATE estoque
          SET quantidade = quantidade + $1
          WHERE id_unidade = $2 AND id_produto = $3`,
          [
            item.quantidade,
            resultado.rows[0].id_unidade,
            item.id_produto
          ]
        );
        if (estoqueAtualizado.rowCount === 0) {
          await conexao.query('ROLLBACK');
          return res.status(409).json({
            erro: 'Não foi possível devolver o produto ao estoque.'
          });
        }
        await conexao.query(
          `INSERT INTO movimentacoes_estoque
          (id_unidade, id_produto, id_pedido, tipo, quantidade, motivo, criado_em)
          VALUES ($1, $2, $3, 'ENTRADA', $4, $5, NOW())`,
          [
            resultado.rows[0].id_unidade,
            item.id_produto,
            id,
            item.quantidade,
            'Devolução de produto por cancelamento do pedido'
          ]
        );
      }
    }
    const atualizado = await conexao.query(
      `UPDATE pedidos
      SET status = $1
      WHERE id = $2
      RETURNING *`,
      [status, id]
    );
    await conexao.query(
      `INSERT INTO logs_auditoria
      (id_usuario, acao, tabela_afetada, id_registro, detalhes, criado_em)
      VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        req.usuario.id,
        'ATUALIZACAO_STATUS',
        'pedidos',
        id,
        `Status alterado de ${statusAtual} para ${status}`
      ]
    );
    await conexao.query('COMMIT');
    return res.status(200).json({
      mensagem: 'Status do pedido atualizado com sucesso.',
      pedido: atualizado.rows[0]
    });
  } catch (erro) {
      if (conexao) {
        await conexao.query('ROLLBACK');
      }
      console.error(erro);
      res.status(500).json({
        erro: 'Erro ao atualizar status do pedido.'
      });
    } finally {
      if (conexao) {
        conexao.release();
      }
    }
});
export default router;