import React, { useEffect, useState } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import axios from 'axios';

function prioridadeCor(prioridade) {
  if (prioridade >= 12) return 'error';
  if (prioridade >= 8) return 'warning';
  return 'primary';
}

function FilaBugs({ perfil }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBugs() {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/bugs/');
        setBugs(response.data);
      } catch (error) {
        setBugs([]);
      }
      setLoading(false);
    }
    fetchBugs();
  }, []);

  // Define colunas por perfil
  const colunas = [
    { key: 'titulo', label: 'Título' },
    { key: 'severidade', label: 'Severidade' },
    { key: 'impacto', label: 'Impacto' },
    { key: 'ambiente', label: 'Ambiente' },
    { key: 'status', label: 'Status' },
    { key: 'prioridade', label: 'Prioridade' },
    { key: 'data_abertura', label: 'Data de abertura' },
  ];
  if (perfil === 'qa') {
    colunas.push({ key: 'frequencia', label: 'Frequência' });
    colunas.push({ key: 'area', label: 'Área' });
  }
  if (perfil === 'po') {
    colunas.push({ key: 'descricao', label: 'Descrição' });
  }

  return (
    <Paper elevation={3} style={{ padding: 24 }}>
      <Typography variant="h6" gutterBottom>
        Fila Dinâmica de Prioridades
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {colunas.map((col) => (
                  <TableCell key={col.key}>{col.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {bugs.map((bug) => (
                <TableRow key={bug.id}>
                  {colunas.map((col) => {
                    if (col.key === 'status') {
                      return (
                        <TableCell key={col.key}>
                          <Chip label={bug.status} color={bug.status === 'Novo' ? 'primary' : bug.status === 'Reaberto' ? 'error' : 'default'} />
                        </TableCell>
                      );
                    }
                    if (col.key === 'prioridade') {
                      return (
                        <TableCell key={col.key}>
                          <Chip label={bug.prioridade.toFixed(1)} color={prioridadeCor(bug.prioridade)} />
                        </TableCell>
                      );
                    }
                    if (col.key === 'data_abertura') {
                      return (
                        <TableCell key={col.key}>{new Date(bug.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                      );
                    }
                    return <TableCell key={col.key}>{bug[col.key]}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default FilaBugs;
