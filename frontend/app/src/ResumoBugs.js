import TablePagination from '@mui/material/TablePagination';
import React, { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Grid, Paper, CircularProgress, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, Avatar, TextField, Tooltip, Fade, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, InputAdornment, IconButton, Chip, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import Menu from '@mui/material/Menu';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from '@mui/x-date-pickers/locales';
import BugReportIcon from '@mui/icons-material/BugReport';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import api from './axios';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';



const COLORS = ['#0d47a1', '#1976d2', '#ff9800', '#e53935', '#43a047', '#8e24aa'];



const COLUNAS_DISPONIVEIS = [
  { key: 'titulo', label: 'Título' },
  { key: 'severidade', label: 'Severidade' },
  { key: 'status', label: 'Status' },
  { key: 'data_abertura', label: 'Abertura' },
];

function ResumoBugs({ atualizar }) {
  // Snackbar para copiar ID
  const [snackbar, setSnackbar] = useState({ open: false, msg: '' });
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setSnackbar({ open: true, msg: `ID copiado: ${id}` });
  };
  const handleCloseSnackbar = () => setSnackbar({ open: false, msg: '' });

  // Personalização de colunas
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
  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Exportação CSV
  const exportarCSV = () => {
    const dados = bugsFiltrados.map(bug => ({
      Título: bug.titulo,
      Severidade: bug.severidade,
      Status: bug.status,
      Abertura: new Date(bug.data_abertura).toLocaleDateString('pt-BR'),
    }));
    const csv = Papa.unparse(dados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bugs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportação PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Últimos Bugs Cadastrados', 14, 14);
    autoTable(doc, {
      head: [['Título', 'Severidade', 'Status', 'Abertura']],
      body: bugsFiltrados.map(bug => [
        bug.titulo,
        bug.severidade,
        bug.status,
        new Date(bug.data_abertura).toLocaleDateString('pt-BR'),
      ]),
      startY: 20,
      styles: { fontSize: 10 },
    });
    doc.save('bugs.pdf');
  };
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroSeveridade, setFiltroSeveridade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroData, setFiltroData] = useState(null);
  const [filtroDataInicio, setFiltroDataInicio] = useState(null);
  const [filtroDataFim, setFiltroDataFim] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [pesquisaTemp, setPesquisaTemp] = useState('');
  const [filtroTabelaSeveridade, setFiltroTabelaSeveridade] = useState('');
  const [filtroTabelaStatus, setFiltroTabelaStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorExport, setAnchorExport] = React.useState(null);
  const handleExportClick = (event) => setAnchorExport(event.currentTarget);
  const handleExportClose = () => setAnchorExport(null);
  const handleExportCSV = () => { handleExportClose(); exportarCSV(); };
  const handleExportPDF = () => { handleExportClose(); exportarPDF(); };

  // Adicionar estados para filtro por período:
  const [filtroDataInicioTabela, setFiltroDataInicioTabela] = useState(null);
  const [filtroDataFimTabela, setFiltroDataFimTabela] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/bugs/')
      .then(res => setBugs(res.data))
      .finally(() => setLoading(false));
  }, [atualizar]);

  // Debounce para pesquisa
  useEffect(() => {
    const handler = setTimeout(() => {
      setPesquisa(pesquisaTemp);
    }, 400);
    return () => clearTimeout(handler);
  }, [pesquisaTemp]);

  let bugsFiltrados = bugs.filter(bug => {
    let dataOk = true;
    if (filtroData) {
      dataOk = bug.data_abertura && new Date(bug.data_abertura).toDateString() === filtroData.toDateString();
    }
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
    // Pesquisa multi-palavra e multi-campo
    const termos = pesquisa.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const pesquisaOk = termos.length === 0 || termos.every(term =>
      [bug.titulo, bug.severidade, bug.status].some(field => (field || '').toLowerCase().includes(term))
    );
    // Filtros dropdown da tabela
    const filtroSevTabelaOk = !filtroTabelaSeveridade || bug.severidade.toLowerCase() === filtroTabelaSeveridade;
    const filtroStatusTabelaOk = !filtroTabelaStatus || bug.status.toLowerCase() === filtroTabelaStatus;
    return (
      (filtroSeveridade === '' || bug.severidade === filtroSeveridade) &&
      (filtroStatus === '' || bug.status === filtroStatus) &&
      dataOk &&
      pesquisaOk &&
      filtroSevTabelaOk &&
      filtroStatusTabelaOk
    );
  });
  // Ordenação
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

  const total = bugs.length;
  const abertos = bugs.filter(b => b.status === 'Novo' || b.status === 'Aberto').length;
  const fechados = bugs.filter(b => b.status === 'Fechado').length;
  const criticos = bugs.filter(b => b.severidade === 'Crítico').length;

  // Severidade
  const porSeveridade = ['Crítico','Alto','Médio','Baixo'].map(sev => ({
    name: sev,
    value: bugs.filter(b => b.severidade === sev).length
  })).filter(s => s.value > 0);

  // Por status
  const porStatus = ['Novo','Aberto','Fechado','Reaberto'].map(st => ({
    name: st,
    value: bugs.filter(b => b.status === st).length
  })).filter(s => s.value > 0);

  // Dados para gráficos
  const severidades = ['baixa', 'media', 'alta', 'critica'];
  const statusList = ['aberto', 'em andamento', 'resolvido', 'fechado'];
  const coresSeveridade = ['#90caf9', '#ffb74d', '#e57373', '#d32f2f'];
  const coresStatus = ['#1976d2', '#fbc02d', '#388e3c', '#616161'];

  const dataSeveridade = severidades.map((sev, i) => ({
    name: sev.charAt(0).toUpperCase() + sev.slice(1),
    value: bugsFiltrados.filter(b => b.severidade === sev).length,
    color: coresSeveridade[i]
  }));
  const dataStatus = statusList.map((st, i) => ({
    name: st.charAt(0).toUpperCase() + st.slice(1),
    value: bugsFiltrados.filter(b => b.status === st).length,
    color: coresStatus[i]
  }));

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, mt: 4 }}>
      <Typography variant="h5" fontWeight={600} align="center" sx={{ mb: 2 }}>
        Resumo dos Bugs
      </Typography>
      <Stack direction="row" spacing={3} justifyContent="center" alignItems="stretch" sx={{ mb: 3 }}>
        {/* Card: Total de Bugs */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={700}>
            <Paper elevation={1} sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              bgcolor: 'primary.50',
              color: 'primary.dark',
              minHeight: 80,
              boxShadow: 1,
              '&:hover': { boxShadow: 3 }
            }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <BugReportIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="h5">{total}</Typography>
                <Typography variant="body2">Total de Bugs</Typography>
                {total > 0 && (
                  <Typography variant="caption" color="primary.dark">
                    {((criticos / total) * 100).toFixed(0)}% críticos
                  </Typography>
                )}
              </Box>
            </Paper>
          </Fade>
        </Grid>
        {/* Card: Críticos */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={900}>
            <Paper elevation={1} sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              bgcolor: 'error.50',
              color: 'error.dark',
              minHeight: 80,
              boxShadow: 1,
              '&:hover': { boxShadow: 3 }
            }}>
              <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                <ErrorIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="h5">{criticos}</Typography>
                <Typography variant="body2">Críticos</Typography>
                <Tooltip title="Bugs com severidade crítica" arrow>
                  <Typography variant="caption" color="error.dark">Prioridade máxima</Typography>
                </Tooltip>
              </Box>
            </Paper>
          </Fade>
        </Grid>
        {/* Card: Abertos */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={1100}>
            <Paper elevation={1} sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              bgcolor: 'secondary.50',
              color: 'secondary.dark',
              minHeight: 80,
              boxShadow: 1,
              '&:hover': { boxShadow: 3 }
            }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                <AssignmentTurnedInIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="h5">{abertos}</Typography>
                <Typography variant="body2">Abertos</Typography>
                <Tooltip title="Bugs ainda não resolvidos" arrow>
                  <Typography variant="caption" color="secondary.dark">Aguardando solução</Typography>
                </Tooltip>
              </Box>
            </Paper>
          </Fade>
        </Grid>
        {/* Card: Fechados */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={1300}>
            <Paper elevation={1} sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              bgcolor: 'success.50',
              color: 'success.dark',
              minHeight: 80,
              boxShadow: 1,
              '&:hover': { boxShadow: 3 }
            }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                <CheckCircleIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="h5">{fechados}</Typography>
                <Typography variant="body2">Fechados</Typography>
                <Tooltip title="Bugs resolvidos e fechados" arrow>
                  <Typography variant="caption" color="success.dark">Resolvidos</Typography>
                </Tooltip>
              </Box>
            </Paper>
          </Fade>
        </Grid>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {/* Últimos bugs cadastrados */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={500} sx={{ flex: 1 }}>Últimos Bugs Cadastrados</Typography>
          <IconButton size="small" sx={{ ml: 1 }} onClick={e => setAnchorEl(e.currentTarget)}>
            <SettingsIcon />
          </IconButton>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Colunas visíveis</Typography>
              {COLUNAS_DISPONIVEIS.map(col => (
                <Box key={col.key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    checked={colunasVisiveis.includes(col.key)}
                    onChange={() => handleToggleColuna(col.key)}
                    size="small"
                  />
                  <Typography variant="body2">{col.label}</Typography>
                </Box>
              ))}
            </Box>
          </Popover>
        </Stack>

        <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2 }}>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Pesquisar (título, severidade, status)"
              value={pesquisaTemp}
              onChange={e => setPesquisaTemp(e.target.value)}
              sx={{ width: '100%', mb: 2 }}
              inputProps={{ 'aria-label': 'Pesquisar bugs' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton tabIndex={-1} edge="end" size="small" disabled>
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel>Severidade</InputLabel>
                <Select
                  value={filtroTabelaSeveridade}
                  label="Severidade"
                  onChange={e => setFiltroTabelaSeveridade(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="Crítico">Crítico</MenuItem>
                  <MenuItem value="Alto">Alto</MenuItem>
                  <MenuItem value="Médio">Médio</MenuItem>
                  <MenuItem value="Baixo">Baixo</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtroTabelaStatus}
                  label="Status"
                  onChange={e => setFiltroTabelaStatus(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="novo">Novo</MenuItem>
                  <MenuItem value="aberto">Aberto</MenuItem>
                  <MenuItem value="em andamento">Em andamento</MenuItem>
                  <MenuItem value="resolvido">Resolvido</MenuItem>
                  <MenuItem value="fechado">Fechado</MenuItem>
                  <MenuItem value="reaberto">Reaberto</MenuItem>
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
                <DatePicker
                  label="Data inicial"
                  value={filtroDataInicioTabela}
                  onChange={setFiltroDataInicioTabela}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 170, flex: 1 } } }}
                  format="dd/MM/yyyy"
                  clearable
                />
                <DatePicker
                  label="Data final"
                  value={filtroDataFimTabela}
                  onChange={setFiltroDataFimTabela}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 170, flex: 1 } } }}
                  format="dd/MM/yyyy"
                  clearable
                />
              </LocalizationProvider>
              <Stack direction="row" spacing={1} sx={{ ml: { md: 2 }, mt: { xs: 2, md: 0 } }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{ minWidth: 110, px: 1.5 }}
                  onClick={handleExportClick}
                >
                  Exportar
                </Button>
                <Menu
                  anchorEl={anchorExport}
                  open={Boolean(anchorExport)}
                  onClose={handleExportClose}
                >
                  <MenuItem onClick={handleExportCSV}>Exportar CSV</MenuItem>
                  <MenuItem onClick={handleExportPDF}>Exportar PDF</MenuItem>
                </Menu>
              </Stack>
            </Stack>
          </Stack>
        </Box>
        {/* Tabela de bugs */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper', p: { xs: 0, sm: 1 } }}>
            <Table size="small" sx={{ minWidth: 420, fontSize: 13 }} aria-label="Tabela de últimos bugs cadastrados">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  {COLUNAS_DISPONIVEIS.filter(col => colunasVisiveis.includes(col.key)).map(col => (
                    <TableCell
                      key={col.key}
                      sx={{ fontWeight: 600, textAlign: 'center', minWidth: 90, cursor: 'pointer', userSelect: 'none', fontSize: 13, py: 0.5 }}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {ordem.coluna === col.key && (
                        <span style={{ fontSize: 13, marginLeft: 4 }}>
                          {ordem.direcao === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {bugsFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(bug => (
                  <TableRow key={bug.id} hover sx={{ fontSize: 13, height: 36 }}>
                    {colunasVisiveis.includes('titulo') && (
                      <TableCell sx={{ textAlign: 'left', fontWeight: 500, wordBreak: 'break-word', maxWidth: 140, fontSize: 13, py: 0.5 }}>
                        <Tooltip title={bug.descricao || 'Sem descrição'} arrow placement="top-start">
                          <span style={{ cursor: bug.descricao ? 'help' : 'default' }}>{bug.titulo}</span>
                        </Tooltip>
                      </TableCell>
                    )}
                    {colunasVisiveis.includes('severidade') && (
                      <TableCell sx={{ textAlign: 'center', fontSize: 13, py: 0.5 }}>
                        <span style={{
                          color: bug.severidade === 'Crítico' ? '#d32f2f' : bug.severidade === 'Alto' ? '#fbc02d' : '#1976d2',
                          fontWeight: 600
                        }}>{bug.severidade}</span>
                      </TableCell>
                    )}
                    {colunasVisiveis.includes('status') && (
                      <TableCell sx={{ textAlign: 'center', fontSize: 13, py: 0.5 }}>
                        <Chip
                          label={bug.status}
                          size="small"
                          color={
                            bug.status === 'Fechado' ? 'success'
                            : bug.status === 'Novo' ? 'primary'
                            : bug.status === 'Em andamento' ? 'warning'
                            : bug.status === 'Reaberto' ? 'error'
                            : 'default'
                          }
                          sx={{ fontWeight: 600, fontSize: 12, minWidth: 70, textTransform: 'capitalize', borderRadius: 1 }}
                        />
                      </TableCell>
                    )}
                    {colunasVisiveis.includes('data_abertura') && (
                      <TableCell sx={{ textAlign: 'center', fontSize: 13, py: 0.5 }}>{new Date(bug.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                    )}
                    {/* Ações rápidas */}
                    <TableCell sx={{ textAlign: 'center', minWidth: 70, fontSize: 13, py: 0.5 }}>
                      <Tooltip title="Copiar ID" arrow>
                        <IconButton size="small" onClick={() => handleCopyId(bug.id)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver detalhes" arrow>
                        <span>
                          <IconButton size="small" disabled>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {bugsFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={colunasVisiveis.length} sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.secondary', fontSize: 13, py: 0.5 }}>Nenhum bug encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Snackbar
              open={snackbar.open}
              autoHideDuration={2000}
              onClose={handleCloseSnackbar}
              message={snackbar.msg}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
            <TablePagination
              component="div"
              count={bugsFiltrados.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20, 50]}
              labelRowsPerPage="Linhas por página"
              sx={{ border: 0 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ResumoBugs;
