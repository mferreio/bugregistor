import React, { useState } from 'react';
import { Container, Typography, AppBar, Toolbar, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import CadastroBug from './CadastroBug';
import FilaBugs from './FilaBugs';
import ResumoBugs from './ResumoBugs';
import Login from './Login';
import Register from './Register';
import { Tabs, Tab } from '@mui/material';
import usePerfil from './usePerfil';
import PainelAdmin from './PainelAdmin';

// Use o caminho público para garantir carregamento correto
const logoBugRegistor = process.env.PUBLIC_URL + '/logo-bugregistor.png';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d47a1', // azul escuro
    },
    background: {
      default: '#fff',
      paper: '#f5f7fa',
    },
    secondary: {
      main: '#1976d2', // azul mais claro
    },
    error: {
      main: '#e53935',
    },
    text: {
      primary: '#222',
      secondary: '#555',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial',
  },
});




function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [atualizarFila, setAtualizarFila] = useState(false);
  const [aba, setAba] = useState(0);

  const handleLogin = (tk) => {
    setToken(tk);
    localStorage.setItem('token', tk);
    setAba(0); // Sempre volta para Resumo ao logar
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setAba(0); // Garante que ao deslogar, próxima sessão começa no Resumo
  };

  // Novo: recebe segundo parâmetro (trocarAba)
  const handleBugCadastrado = (bug, trocarAba = true) => {
    setAtualizarFila((prev) => !prev);
    if (trocarAba) setAba(2);
  };

  // Chama sempre o hook, mas só usa dados se houver token
  const { perfil, usuario, loading: loadingPerfil } = usePerfil();

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  if (loadingPerfil && token) {
    return <Box sx={{ mt: 8, textAlign: 'center' }}><Typography>Carregando perfil...</Typography></Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img src={logoBugRegistor} alt="BugRegistor Logo" style={{ height: 44, marginRight: 16 }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: '#183153', letterSpacing: 0.5 }}>
              <span style={{ color: '#183153' }}>Bug</span><span style={{ color: '#4caf50' }}>Registor</span>
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Typography variant="body2" sx={{ cursor: 'pointer' }} onClick={handleLogout}>
              Sair
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'right', color: 'text.secondary' }}>
            Usuário: <b>{usuario?.username}</b> | Perfil: <b>{perfil}</b>
          </Typography>
          <Tabs value={aba} onChange={(_, v) => setAba(v)} centered sx={{ mb: 3 }}>
            <Tab label="Resumo" />
            {(perfil === 'QA' || perfil === 'DEV' || perfil === 'Admin') && <Tab label="Cadastrar Bug" />}
            {(perfil !== 'Consulta') && <Tab label="Fila de Bugs" />}
            {perfil === 'Admin' && <Tab label="Painel Admin" />}
          </Tabs>
          {aba === 0 && <ResumoBugs atualizar={atualizarFila} />}
          {aba === 1 && (perfil === 'QA' || perfil === 'DEV' || perfil === 'Admin') && <CadastroBug onBugCadastrado={handleBugCadastrado} />}
          {aba === 2 && perfil !== 'Consulta' && <FilaBugs atualizar={atualizarFila} perfil={perfil} />}
          {aba === 3 && perfil === 'Admin' && <PainelAdmin />}
        </Box>
      </Container>
      <Box component="footer" sx={{
        width: '100%',
        bgcolor: 'background.paper',
        color: 'text.secondary',
        py: 2,
        px: 0,
        mt: 6,
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        fontSize: 14,
        letterSpacing: 0.2,
        boxShadow: 0,
      }}>
        Desenvolvido por <b>Matheus Ferreira de Oliveira</b> &lt;<a href="mailto:mferreio@emeal.nttdata.com" style={{ color: '#388e3c', textDecoration: 'none', fontWeight: 500 }}>mferreio@emeal.nttdata.com</a>&gt;
      </Box>
    </ThemeProvider>
  );
}

export default App;
