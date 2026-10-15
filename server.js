const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'confirmados.json');

app.use(express.json());
app.use(express.static(__dirname));

// Rota para buscar confirmados
app.get('/api/confirmados', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        return res.json([]);
    }
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json(data);
    } catch (err) {
        res.json([]);
    }
});

// Rota para salvar nova confirmação
app.post('/api/confirmar', (req, res) => {
    const { nome, telefone } = req.body;
    if (!nome || !telefone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }

    let confirmados = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            confirmados = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (err) {
            confirmados = [];
        }
    }

    const novoConvidado = {
        nome,
        telefone,
        data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    confirmados.push(novoConvidado);
    fs.writeFileSync(DATA_FILE, JSON.stringify(confirmados, null, 2), 'utf8');

    res.json({ success: true, message: 'Presença confirmada com sucesso!' });
});

// Rota para baixar a planilha Excel (.xlsx) atualizada
app.get('/api/baixar-planilha', (req, res) => {
    let confirmados = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            confirmados = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (err) {
            confirmados = [];
        }
    }

    const dadosExport = confirmados.map(c => ({
        "Nome do Convidado": c.nome,
        "Telefone": c.telefone,
        "Data de Confirmação": c.data
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Confirmados");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename="Convidados_Confirmados_Daniel_e_Luciana.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
