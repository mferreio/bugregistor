
import React, { useEffect, useState } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, CircularProgress, Box, IconButton, Tooltip } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import api from './axios';

const perfis = ['QA', 'DEV', 'PO', 'Admin', 'Consulta'];

function PainelAdmin() {
    const [novoUsuario, setNovoUsuario] = useState({ username: '', password: '', perfil: 'QA' });
    const [msg, setMsg] = useState('');

    const handleNovoChange = e => {
      setNovoUsuario({ ...novoUsuario, [e.target.name]: e.target.value });
    };

    const handleCriarUsuario = async (e) => {
      e.preventDefault();
      setAlterando('novo');
      setMsg('');
      try {
        await api.post('/register', novoUsuario);
        setMsg('Usuário criado com sucesso!');
        setNovoUsuario({ username: '', password: '', perfil: 'QA' });
        fetchUsuarios();
      } catch {
        setMsg('Erro ao criar usuário.');
      }
      setAlterando(null);
    };
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alterando, setAlterando] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handlePerfilChange = async (id, novoPerfil) => {
    setAlterando(id);
    try {
      await api.patch(`/usuarios/${id}/perfil`, { perfil: novoPerfil });
      setUsuarios((prev) => prev.map(u => u.id === id ? { ...u, perfil: novoPerfil } : u));
    } finally {
      setAlterando(null);
    }
  };

  const handleBloquear = async (id, bloquear) => {
    setAlterando(id);
    try {
      await api.patch(`/usuarios/${id}/ativo?bloquear=${bloquear}`);
      setUsuarios((prev) => prev.map(u => u.id === id ? { ...u, ativo: bloquear ? 0 : 1 } : u));
    } finally {
      setAlterando(null);
    }
  };

  const handleExcluir = async (id) => {
    setAlterando(id);
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios((prev) => prev.filter(u => u.id !== id));
    } finally {
      setAlterando(null);
    }
  };

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
        Criar Novo Usuário
      </Typography>
      <Box component="form" onSubmit={handleCriarUsuario} sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <input name="username" placeholder="Usuário" value={novoUsuario.username} onChange={handleNovoChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }} />
        <input name="password" type="password" placeholder="Senha" value={novoUsuario.password} onChange={handleNovoChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }} />
        <select name="perfil" value={novoUsuario.perfil} onChange={handleNovoChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 100 }}>
          {perfis.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" disabled={alterando === 'novo'} style={{ padding: '8px 16px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600 }}>Criar</button>
      </Box>
      {msg && <Typography sx={{ mb: 2, color: msg.includes('sucesso') ? 'green' : 'red' }}>{msg}</Typography>}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
        Gerenciamento de Usuários
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Select
                      value={u.perfil}
                      onChange={e => handlePerfilChange(u.id, e.target.value)}
                      disabled={alterando === u.id}
                      size="small"
                    >
                      {perfis.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.ativo ? (
                      <span style={{ color: 'green', fontWeight: 600 }}>Ativo</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 600 }}>Bloqueado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={u.ativo ? 'Bloquear' : 'Desbloquear'}>
                      <span>
                        <IconButton onClick={() => handleBloquear(u.id, !u.ativo)} disabled={alterando === u.id} color={u.ativo ? 'error' : 'success'}>
                          {u.ativo ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <span>
                        <IconButton onClick={() => handleExcluir(u.id)} disabled={alterando === u.id} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default PainelAdmin;
