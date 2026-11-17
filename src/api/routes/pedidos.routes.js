import express from 'express';
import pool from '../../infrastructure/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM pedidos ORDER BY id DESC'
    );
    res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: 'Erro ao consultar pedidos.'
    });
  }
});

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
////

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
      'SELECT id, status FROM pedidos WHERE id = $1',
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
    const precoUnitario = produto.rows[0].preco;
    const resultado = await conexao.query(
        `INSERT INTO itens_pedido
        (id_pedido, id_produto, quantidade, preco_unitario)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [id, id_produto, quantidade, precoUnitario]
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


router.post('/:id/pagamento', async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;
    const { metodo } = req.body;
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
    const pagamento = await conexao.query(
      `INSERT INTO pagamentos
      (id_pedido, valor, metodo, status, criado_em, referencia_gateway, resposta_gateway)
      VALUES ($1, $2, $3, 'APROVADO', NOW(), $4, $5)
      RETURNING *`,
      [
        id,
        pedido.rows[0].valor_total,
        metodo,
        `SIMULADO-${id}`,
        'Pagamento aprovado em ambiente de testes'
      ]
    );
    await conexao.query(
      `UPDATE pedidos
      SET status = 'PAGO'
      WHERE id = $1`,
      [id]
    );
    await conexao.query('COMMIT');
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

export default router;