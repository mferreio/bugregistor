import React, { useEffect, useState } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Box, Button, Stack, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, Tooltip, Grid, Avatar, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DialogContentText from '@mui/material/DialogContentText';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from './axios';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from '@mui/x-date-pickers/locales';

// Função utilitária para exportar array de objetos para CSV (com BOM UTF-8 e colunas corretas)
function exportarParaCSV(dados, colunas, nomeArquivo = 'bugs.csv') {
  if (!dados || !dados.length) return;
  const separador = ',';
  // Remove coluna "Ações" se existir
  const colunasExport = colunas.filter(c => c.key !== 'acoes');
  const cabecalho = colunasExport.map(c => c.label).join(separador);
  const linhas = dados.map(bug =>
    colunasExport.map(c => {
      let valor = bug[c.key];
      if (c.key === 'usuario') valor = bug.usuario || '-';
      if (c.key === 'data_abertura' && valor) {
        // Formata data para dd/mm/yyyy
        try {
          const d = new Date(valor);
          valor = d.toLocaleDateString('pt-BR');
        } catch {}
      }
      if (valor === undefined || valor === null) valor = '';
      return '"' + String(valor).replace(/"/g, '""') + '"';
    }).join(separador)
  );
  // Adiciona BOM UTF-8 para Excel reconhecer acentuação
  const csv = '\uFEFF' + [cabecalho, ...linhas].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Mapeamento de status para cor e ícone
const statusMap = {
  'aberto':   { color: 'primary', icon: <HourglassEmptyIcon fontSize="small" /> },
  'em andamento': { color: 'warning', icon: <AutorenewIcon fontSize="small" /> },
  'fechado':  { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  'reaberto': { color: 'error', icon: <ReplayIcon fontSize="small" /> },
  'pendente': { color: 'default', icon: <ErrorOutlineIcon fontSize="small" /> },
  'cancelado': { color: 'default', icon: <ErrorOutlineIcon fontSize="small" /> },
};

function getStatusProps(status) {
  if (!status) return { color: 'default', icon: null };
  const key = status.trim().toLowerCase();
  return statusMap[key] || { color: 'default', icon: null };
}

function prioridadeCor(prioridade) {
  if (prioridade >= 12) return 'error';
  if (prioridade >= 8) return 'warning';
  return 'primary';
}

const campoMap = {
  titulo: 'Título',
  descricao: 'Descrição',
  severidade: 'Severidade',
  impacto: 'Impacto',
  ambiente: 'Ambiente',
  frequencia: 'Frequência',
  area: 'Área',
  evidencias: 'Evidências',
  status: 'Status',
  prioridade: 'Prioridade',
  data_abertura: 'Data de abertura',
};

function FilaBugs({ perfil }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsCriacao, setLogsCriacao] = useState({}); // { bug_id: usuario }
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [modalLogCreate, setModalLogCreate] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [atualizar, setAtualizar] = useState(0);

  useEffect(() => {
    async function fetchBugsAndLogs() {
      setLoading(true);
      try {
        const response = await api.get('/bugs/');
        let bugsFiltrados = response.data;
        // Perfil Consulta agora pode visualizar todos os bugs, sem filtro de status
        setBugs(bugsFiltrados);
        // Para cada bug, buscar o log CREATE
        const logsObj = {};
        await Promise.all(bugsFiltrados.map(async (bug) => {
          try {
            const logsResp = await api.get(`/bugs/${bug.id}/logs`);
            const logCreate = logsResp.data.find(l => l.acao === 'CREATE');
            if (logCreate) logsObj[bug.id] = logCreate.usuario;
          } catch {}
        }));
        setLogsCriacao(logsObj);
      } catch (error) {
        setBugs([]);
        setLogsCriacao({});
      }
      setLoading(false);
    }
    fetchBugsAndLogs();
  }, [atualizar, perfil]);

  // Personalização de colunas
  const COLUNAS_DISPONIVEIS = [
    { key: 'titulo', label: 'Título' },
    { key: 'severidade', label: 'Severidade' },
    { key: 'usuario', label: 'Usuário' },
    { key: 'status', label: 'Status' },
    { key: 'prioridade', label: 'Prioridade' },
    { key: 'data_abertura', label: 'Data de abertura' },
  ];
  const [colunasVisiveis, setColunasVisiveis] = useState(COLUNAS_DISPONIVEIS.map(c => c.key));
  const handleToggleColuna = (key) => {
    setColunasVisiveis(cols =>
      cols.includes(key)
        ? cols.length > 1 ? cols.filter(c => c !== key) : cols // sempre pelo menos 1 coluna
        : [...cols, key]
    );
  };
  // Ordenação
  const [ordem, setOrdem] = useState({ coluna: 'data_abertura', direcao: 'desc' });
  const handleSort = (coluna) => {
    setOrdem(ordemAtual => {
      if (ordemAtual.coluna === coluna) {
        return { coluna, direcao: ordemAtual.direcao === 'asc' ? 'desc' : 'asc' };
      }
      return { coluna, direcao: 'asc' };
    });
  };
  // Filtro por período
  const [filtroDataInicio, setFiltroDataInicio] = useState(null);
  const [filtroDataFim, setFiltroDataFim] = useState(null);
  // Snackbar para copiar ID
  const [snackbar, setSnackbar] = useState({ open: false, msg: '' });
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setSnackbar({ open: true, msg: `ID copiado: ${id}` });
  };
  const handleCloseSnackbar = () => setSnackbar({ open: false, msg: '' });
  let bugsFiltrados = bugs.filter(bug => {
    let dataOk = true;
    if (filtroDataInicio) {
      const bugData = bug.data_abertura && new Date(bug.data_abertura).setHours(0,0,0,0);
      const inicio = new Date(filtroDataInicio).setHours(0,0,0,0);
      if (!bugData || bugData < inicio) dataOk = false;
    }
    if (filtroDataFim) {
      const bugData = bug.data_abertura && new Date(bug.data_abertura).setHours(0,0,0,0);
      const fim = new Date(filtroDataFim).setHours(0,0,0,0);
      if (!bugData || bugData > fim) dataOk = false;
    }
    return dataOk;
  });
  if (ordem.coluna) {
    bugsFiltrados = [...bugsFiltrados].sort((a, b) => {
      let va = a[ordem.coluna], vb = b[ordem.coluna];
      if (ordem.coluna === 'data_abertura') {
        va = va ? new Date(va) : 0;
        vb = vb ? new Date(vb) : 0;
      } else {
        va = (va || '').toString().toLowerCase();
        vb = (vb || '').toString().toLowerCase();
      }
      if (va < vb) return ordem.direcao === 'asc' ? -1 : 1;
      if (va > vb) return ordem.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const colunas = [
    ...COLUNAS_DISPONIVEIS.filter(c => colunasVisiveis.includes(c.key)),
    // Só mostra coluna de ações se não for Consulta
    ...((perfil || '').toLowerCase() !== 'consulta' ? [{ key: 'acoes', label: 'Ações' }] : []),
  ];

  const [modalBug, setModalBug] = useState(null);
  const [editando, setEditando] = useState(null);
  const [bugEdit, setBugEdit] = useState({});
  const [alterando, setAlterando] = useState(null);

  const handleExcluir = async (id) => {
    setAlterando(id);
    try {
      await api.delete(`/bugs/${id}`);
      setBugs(bugs.filter(b => b.id !== id));
    } finally {
      setAlterando(null);
    }
  };

  const handleEditar = (bug) => {
    setEditando(bug.id);
    setBugEdit({ ...bug });
  };

  const handleEditChange = (e) => {
    setBugEdit({ ...bugEdit, [e.target.name]: e.target.value });
  };

  const handleSalvar = async (id) => {
    setAlterando(id);
    try {
      await api.patch(`/bugs/${id}`, bugEdit);
      setBugs(bugs.map(b => b.id === id ? { ...b, ...bugEdit } : b));
      setEditando(null);
    } finally {
      setAlterando(null);
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setBugEdit({});
  };

  // Carrega logs ao abrir modal
  useEffect(() => {
    if (modalBug && modalBug.id) {
      setLoadingLogs(true);
      api.get(`/bugs/${modalBug.id}/logs`).then(res => {
        setLogs(res.data);
      }).catch(() => setLogs([])).finally(() => setLoadingLogs(false));
    } else {
      setLogs([]);
    }
  }, [modalBug]);

  // Adiciona campo usuario para exportação
  const bugsParaExportar = bugs.map(bug => ({
    ...bug,
    usuario: logsCriacao[bug.id] || '-'
  }));

  return (
    <Paper elevation={4} sx={{ p: isMobile ? 1 : 4, borderRadius: 3, mb: 4, width: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: isMobile ? 18 : 22 }}>
            Fila Dinâmica de Prioridades
          </Typography>
          {COLUNAS_DISPONIVEIS.map(col => (
            <Button
              key={col.key}
              variant={colunasVisiveis.includes(col.key) ? 'contained' : 'outlined'}
              color={colunasVisiveis.includes(col.key) ? 'primary' : 'inherit'}
              size="small"
              onClick={() => handleToggleColuna(col.key)}
              sx={{ minWidth: 0, px: 1, fontSize: 12, fontWeight: 600, textTransform: 'none' }}
            >
              {col.label}
            </Button>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
            <DatePicker
              label="Data inicial"
              value={filtroDataInicio}
              onChange={setFiltroDataInicio}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
              format="dd/MM/yyyy"
              clearable
            />
            <DatePicker
              label="Data final"
              value={filtroDataFim}
              onChange={setFiltroDataFim}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
              format="dd/MM/yyyy"
              clearable
            />
          </LocalizationProvider>
          {(perfil || '').toLowerCase() !== 'consulta' && (
            <Button
              variant="outlined"
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              onClick={() => exportarParaCSV(bugsParaExportar, colunas)}
              sx={{ fontWeight: 600, minWidth: isMobile ? 80 : 120 }}
            >
              Exportar CSV
            </Button>
          )}
        </Stack>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        bugs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary', fontSize: 18 }}>
            Nenhum bug disponível para exibição.
          </Box>
        ) : (
          <>
          <TableContainer sx={{ borderRadius: 2, bgcolor: 'background.paper', width: '100%', maxWidth: '100%' }}>
            <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 650, width: '100%' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  {colunas.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        color: '#1a237e',
                        fontWeight: 700,
                        fontSize: isMobile ? 13 : 16,
                        px: isMobile ? 0.5 : 2,
                        letterSpacing: 0.5,
                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                        wordBreak: 'break-word',
                        maxWidth: isMobile ? 90 : undefined,
                        textAlign: 'center',
                        cursor: ['acoes'].includes(col.key) ? 'default' : 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => !['acoes'].includes(col.key) && handleSort(col.key)}
                    >
                      {col.label}
                      {ordem.coluna === col.key && (
                        <span style={{ fontSize: 14, marginLeft: 4 }}>
                          {ordem.direcao === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {bugsFiltrados.map((bug) => (
                  <TableRow
                    key={bug.id}
                    hover
                    sx={{ transition: 'background 0.2s', cursor: 'pointer' }}
                    onClick={(e) => {
                      // Evita abrir modal ao clicar nos botões de ação
                      if (e.target.closest('.bug-action-btn')) return;
                      setModalBug(bug);
                    }}
                  >
                    {colunas.map((col) => (
                      col.key === 'usuario' ? (
                        <TableCell key={col.key} sx={{
                          fontSize: isMobile ? 12 : 15,
                          px: isMobile ? 0.5 : 2,
                          whiteSpace: isMobile ? 'normal' : 'nowrap',
                          wordBreak: 'break-word',
                          maxWidth: isMobile ? 80 : undefined,
                        }}>
                          {logsCriacao[bug.id] || '-'}
                        </TableCell>
                      ) : col.key === 'acoes' ? (
                        (perfil || '').toLowerCase() === 'consulta' ? null : (
                          <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                            <Stack direction="row" spacing={isMobile ? 0.5 : 1}>
                              {editando === bug.id ? (
                                <>
                                  <Button className="bug-action-btn" onClick={() => handleSalvar(bug.id)} disabled={alterando === bug.id} variant="contained" color="success" size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 48 : 80, fontSize: isMobile ? 10 : 14, px: isMobile ? 1 : 2 }}>Salvar</Button>
                                  <Button className="bug-action-btn" onClick={handleCancelar} variant="outlined" color="inherit" size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 48 : 80, fontSize: isMobile ? 10 : 14, px: isMobile ? 1 : 2 }}>Cancelar</Button>
                                </>
                              ) : (
                                <>
                                  <Button className="bug-action-btn" onClick={() => handleEditar(bug)} disabled={alterando === bug.id} variant="outlined" color="primary" size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 48 : 80, fontSize: isMobile ? 10 : 14, px: isMobile ? 1 : 2 }}>Editar</Button>
                                  <Button className="bug-action-btn" onClick={() => handleExcluir(bug.id)} disabled={alterando === bug.id} variant="outlined" color="error" size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 48 : 80, fontSize: isMobile ? 10 : 14, px: isMobile ? 1 : 2 }}>Excluir</Button>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        )
                      ) : editando === bug.id && ["titulo","descricao","severidade","impacto","ambiente","frequencia","area","status"].includes(col.key) ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                          <input name={col.key} value={bugEdit[col.key] || ''} onChange={handleEditChange} style={{ width: '100%', fontSize: isMobile ? 12 : 15 }} />
                        </TableCell>
                      ) : editando === bug.id && col.key === 'prioridade' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                          <input name="prioridade" type="number" value={bugEdit.prioridade || ''} onChange={handleEditChange} style={{ width: 60, fontSize: isMobile ? 12 : 15 }} />
                        </TableCell>
                      ) : editando === bug.id && col.key === 'data_abertura' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                          <input name="data_abertura" type="date" value={bugEdit.data_abertura ? bugEdit.data_abertura.slice(0,10) : ''} onChange={handleEditChange} style={{ fontSize: isMobile ? 12 : 15 }} />
                        </TableCell>
                      ) : col.key === 'status' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                          <Chip
                            label={bug.status}
                            color={getStatusProps(bug.status).color}
                            icon={getStatusProps(bug.status).icon}
                            sx={{ fontWeight: 600, fontSize: isMobile ? 11 : 14, height: isMobile ? 22 : 28, textTransform: 'capitalize', px: isMobile ? 0.5 : 2 }}
                            aria-label={`Status: ${bug.status}`}
                          />
                        </TableCell>
                      ) : col.key === 'prioridade' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>
                          <Chip label={typeof bug.prioridade === 'number' ? bug.prioridade.toFixed(1) : (bug.prioridade || '-')}
                            color={prioridadeCor(Number(bug.prioridade))}
                            sx={{ fontWeight: 600, fontSize: isMobile ? 11 : 14, height: isMobile ? 22 : 28, px: isMobile ? 0.5 : 2 }} />
                        </TableCell>
                      ) : col.key === 'data_abertura' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2 }}>{new Date(bug.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                      ) : col.key === 'titulo' ? (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2, fontSize: isMobile ? 12 : 15, whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word', maxWidth: isMobile ? 90 : undefined }}>
                          <Tooltip title={bug.descricao || 'Sem descrição'} arrow placement="top-start">
                            <span style={{ cursor: bug.descricao ? 'help' : 'default' }}>{bug.titulo}</span>
                          </Tooltip>
                        </TableCell>
                      ) : (
                        <TableCell key={col.key} sx={{ px: isMobile ? 0.5 : 2, fontSize: isMobile ? 12 : 15, whiteSpace: isMobile ? 'normal' : 'nowrap', wordBreak: 'break-word', maxWidth: isMobile ? 90 : undefined }}>{bug[col.key]}</TableCell>
                      )
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={2000}
            onClose={handleCloseSnackbar}
            message={snackbar.msg}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </>
        )
      )}
      {/* Modal de detalhes do bug */}
      <Dialog
        open={!!modalBug}
        onClose={() => setModalBug(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="bug-details-title"
        PaperProps={{
          sx: {
            border: modalBug && modalBug.severidade === 'Crítico' ? '2px solid #d32f2f' : undefined,
            boxShadow: 8,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e3eafc 100%)',
            minHeight: 320,
          },
        }}
        disableEnforceFocus={false}
        scroll="body"
      >
        {modalBug && (
          <>
            <DialogTitle id="bug-details-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, gap: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: 2 }}>
                  <BugReportIcon fontSize="medium" />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Tooltip title={modalBug.titulo} placement="bottom-start">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: isMobile ? 180 : 320 }}>
                      {modalBug.titulo}
                    </Typography>
                  </Tooltip>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    <Tooltip title="Severidade">
                      <Chip label={modalBug.severidade} color={modalBug.severidade === 'Crítico' ? 'error' : 'warning'} size="small" icon={<PriorityHighIcon />} sx={{ fontWeight: 600, fontSize: 13, px: 1.2, boxShadow: modalBug.severidade === 'Crítico' ? 2 : 0 }} />
                    </Tooltip>
                    <Tooltip title="Status">
                      <Chip
                        label={modalBug.status}
                        color={getStatusProps(modalBug.status).color}
                        icon={getStatusProps(modalBug.status).icon}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 13, px: 1.2, textTransform: 'capitalize' }}
                        aria-label={`Status: ${modalBug.status}`}
                      />
                    </Tooltip>
                    <Tooltip title="Prioridade">
                      <Chip label={modalBug.prioridade} color={prioridadeCor(modalBug.prioridade)} size="small" icon={<PriorityHighIcon />} sx={{ fontWeight: 600, fontSize: 13, px: 1.2 }} />
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>
              <IconButton onClick={() => setModalBug(null)} size="small" aria-label="Fechar detalhes do bug" sx={{ ml: 1 }} autoFocus tabIndex={0}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: 'background.default', pt: 2, px: isMobile ? 1 : 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EventIcon color="action" />
                    <Typography variant="subtitle2">Data de abertura:</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 1 }}>{new Date(modalBug.data_abertura).toLocaleDateString('pt-BR')}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PlaceIcon color="action" />
                    <Typography variant="subtitle2">Ambiente:</Typography>
                  </Stack>
                  <Tooltip title={modalBug.ambiente} placement="bottom-start">
                    <Typography variant="body2" sx={{ mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 200 }}>{modalBug.ambiente}</Typography>
                  </Tooltip>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InfoIcon color="action" />
                    <Typography variant="subtitle2">Impacto:</Typography>
                  </Stack>
                  <Tooltip title={modalBug.impacto} placement="bottom-start">
                    <Typography variant="body2" sx={{ mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 200 }}>{modalBug.impacto}</Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InfoIcon color="action" />
                    <Typography variant="subtitle2">Frequência:</Typography>
                  </Stack>
                  <Tooltip title={modalBug.frequencia} placement="bottom-start">
                    <Typography variant="body2" sx={{ mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 200 }}>{modalBug.frequencia}</Typography>
                  </Tooltip>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InfoIcon color="action" />
                    <Typography variant="subtitle2">Área:</Typography>
                  </Stack>
                  <Tooltip title={modalBug.area} placement="bottom-start">
                    <Typography variant="body2" sx={{ mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 200 }}>{modalBug.area}</Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 2, p: 2, boxShadow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DescriptionIcon color="action" />
                      <Typography variant="subtitle2">Descrição:</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 0.5, color: 'text.secondary', fontSize: isMobile ? 14 : 16 }}>{modalBug.descricao}</Typography>
                  </Box>
                </Grid>
              </Grid>
            {/* Log de operações */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ px: 1, pb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Histórico de Operações
              </Typography>
              {loadingLogs ? (
                <Typography variant="body2">Carregando histórico...</Typography>
              ) : logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhuma operação registrada para este bug.</Typography>
              ) : (
                <TableContainer sx={{ bgcolor: '#f8fafc', borderRadius: 2, boxShadow: 0, maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Data/Hora</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Usuário</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>Ação</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Campo</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>De</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Para</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Exibir apenas 1 linha para CREATE (mais recente), e todas UPDATE/DELETE normalmente
                        const logsSorted = logs
                          .filter(log => {
                            // Oculta updates irrelevantes (exemplo: prioridade, data_abertura, id)
                            if (log.acao === 'UPDATE' && ['id', 'data_abertura', 'prioridade'].includes((log.campo || '').toLowerCase())) return false;
                            return true;
                          })
                          .sort((a, b) => new Date(b.data) - new Date(a.data));
                        const createLog = logsSorted.find(l => l.acao === 'CREATE');
                        const otherLogs = logsSorted.filter(l => l.acao !== 'CREATE');
                        const allLogs = [];
                        if (createLog) allLogs.push(createLog);
                        allLogs.push(...otherLogs);
                        const campoMap = {
                          titulo: 'Título',
                          descricao: 'Descrição',
                          severidade: 'Severidade',
                          impacto: 'Impacto',
                          ambiente: 'Ambiente',
                          frequencia: 'Frequência',
                          area: 'Área',
                          evidencias: 'Evidências',
                          status: 'Status',
                          prioridade: 'Prioridade',
                          data_abertura: 'Data de abertura',
                        };
                        const renderValor = (valor) => {
                          if (!valor || valor === '-') return '-';
                          const str = String(valor);
                          return str.length > 18 ? (
                            <Tooltip title={str}><span>{str.slice(0, 15)}...</span></Tooltip>
                          ) : str;
                        };
                        return allLogs.map((log, idx) => {
                          const campoLabel = log.campo ? (campoMap[log.campo] || log.campo.charAt(0).toUpperCase() + log.campo.slice(1)) : '-';
                          const userInitial = log.usuario ? log.usuario.charAt(0).toUpperCase() : '?';
                          let acaoColor = 'inherit';
                          let acaoBg = 'none';
                          let acaoLabel = log.acao;
                          if (log.acao === 'CREATE') { acaoColor = 'success.main'; acaoBg = '#e8f5e9'; acaoLabel = 'Criação'; }
                          if (log.acao === 'DELETE') { acaoColor = 'error.main'; acaoBg = '#ffebee'; acaoLabel = 'Exclusão'; }
                          if (log.acao === 'UPDATE') { acaoColor = 'primary.main'; acaoBg = '#e3f2fd'; acaoLabel = 'Alteração'; }
                          const zebra = idx % 2 === 0 ? '#f8fafc' : '#e3eafc';
                          // Para CREATE, exibe detalhes ao clicar
                          const handleRowClick = () => {
                            if (log.acao === 'CREATE') setModalLogCreate(log);
                          };
                          return (
                            <TableRow key={log.id} sx={{ bgcolor: log.acao === 'CREATE' ? '#e8f5e9' : log.acao === 'DELETE' ? '#ffebee' : zebra, cursor: log.acao === 'CREATE' ? 'pointer' : 'default' }} onClick={handleRowClick}>
                              <TableCell sx={{ fontSize: 13 }}>{new Date(log.data).toLocaleString('pt-BR')}</TableCell>
                              <TableCell sx={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2', fontSize: 14 }}>{userInitial}</Avatar>
                                <span style={{ marginLeft: 4 }}>{log.usuario}</span>
                              </TableCell>
                              <TableCell sx={{ fontSize: 13, fontWeight: 600, color: acaoColor, bgcolor: acaoBg, borderRadius: 1 }}>{acaoLabel}</TableCell>
                              <TableCell sx={{ fontSize: 13 }}>{campoLabel}</TableCell>
                              <TableCell sx={{ fontSize: 13 }}>{renderValor(log.valor_anterior)}</TableCell>
                              <TableCell sx={{ fontSize: 13 }}>{renderValor(log.valor_novo)}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                          {/* Modal de detalhes do cadastro inicial (CREATE) */}
                          <Dialog open={!!modalLogCreate} onClose={() => setModalLogCreate(null)} maxWidth="xs" fullWidth>
                            <DialogTitle>Detalhes do Cadastro Inicial</DialogTitle>
                            <DialogContent dividers>
                              {modalLogCreate && (() => {
                                let campos = {};
                                try {
                                  campos = JSON.parse(modalLogCreate.valor_novo);
                                } catch {
                                  campos = {};
                                }
                                return (
                                  <Box>
                                    {Object.entries(campos).map(([campo, valor]) => (
                                      <Box key={campo} sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{campoMap[campo] || campo.charAt(0).toUpperCase() + campo.slice(1)}:</Typography>
                                        <Typography variant="body2" color="text.secondary">{String(valor)}</Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                );
                              })()}
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={() => setModalLogCreate(null)} color="primary" variant="contained">Fechar</Button>
                            </DialogActions>
                          </Dialog>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
            </DialogContent>
            <DialogActions sx={{ px: isMobile ? 1 : 3, pb: isMobile ? 1 : 2 }}>
              <Button onClick={() => setModalBug(null)} color="primary" variant="contained" autoFocus tabIndex={0} sx={{ fontWeight: 600, minWidth: 100 }}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );

}
export default FilaBugs;
