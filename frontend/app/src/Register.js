import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, MenuItem } from '@mui/material';
import axios from 'axios';

const perfis = [
  { value: 'QA', label: 'QA' },
  { value: 'DEV', label: 'DEV' },
  { value: 'PO', label: 'PO' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Consulta', label: 'Consulta' },
];

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState('QA');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://127.0.0.1:8000/register', {
        username,
        password,
        perfil,
      });
      setSuccess('Usuário registrado com sucesso!');
      onRegister && onRegister();
    } catch (err) {
      setError('Erro ao registrar. Usuário pode já existir.');
    }
    setLoading(false);
  };

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 3, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Registrar
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          label="Perfil"
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {perfis.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar'}
        </Button>
      </form>
    </Paper>
  );
}

export default Register;
