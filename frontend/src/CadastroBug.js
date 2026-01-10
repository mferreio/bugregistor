import React, { useState } from 'react';
import { TextField, Button, Grid, Paper, Typography } from '@mui/material';
import axios from 'axios';

const campos = [
  { name: 'titulo', label: 'Título', required: true },
  { name: 'descricao', label: 'Descrição', required: true, multiline: true },
  { name: 'severidade', label: 'Severidade', required: true },
  { name: 'impacto', label: 'Impacto no usuário', required: true },
  { name: 'ambiente', label: 'Ambiente', required: true },
  { name: 'frequencia', label: 'Frequência de ocorrência', required: true },
  { name: 'area', label: 'Área do sistema', required: true },
  { name: 'evidencias', label: 'Evidências', required: false, multiline: true },
];

const initialState = campos.reduce((acc, campo) => {
  acc[campo.name] = '';
  return acc;
}, {});

function CadastroBug({ onBugCadastrado }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/bugs/', form);
      setMensagem('Bug cadastrado com sucesso!');
      setForm(initialState);
      if (onBugCadastrado) onBugCadastrado(response.data);
    } catch (error) {
      setMensagem('Erro ao cadastrar bug.');
    }
    setLoading(false);
  };

  return (
    <Paper elevation={3} style={{ padding: 24, marginBottom: 32 }}>
      <Typography variant="h6" gutterBottom>
        Cadastro de Bug
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {campos.map((campo) => (
            <Grid item xs={12} sm={campo.multiline ? 12 : 6} key={campo.name}>
              <TextField
                fullWidth
                label={campo.label}
                name={campo.name}
                value={form[campo.name]}
                onChange={handleChange}
                required={campo.required}
                multiline={!!campo.multiline}
                minRows={campo.multiline ? 3 : 1}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Bug'}
            </Button>
          </Grid>
          {mensagem && (
            <Grid item xs={12}>
              <Typography color={mensagem.includes('sucesso') ? 'primary' : 'error'}>
                {mensagem}
              </Typography>
            </Grid>
          )}
        </Grid>
      </form>
    </Paper>
  );
}

export default CadastroBug;
