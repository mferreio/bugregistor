import React, { useState } from 'react';
import { TextField, Button, Grid, Paper, Typography, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import api from './axios';

const severidades = [
  { value: 'Crítico', label: 'Crítico' },
  { value: 'Alto', label: 'Alto' },
  { value: 'Médio', label: 'Médio' },
  { value: 'Baixo', label: 'Baixo' },
];
const impactos = [
  { value: 'Alto', label: 'Alto' },
  { value: 'Médio', label: 'Médio' },
  { value: 'Baixo', label: 'Baixo' },
  { value: 'Nenhum', label: 'Nenhum' },
];
const ambientes = [
  { value: 'Produção', label: 'Produção' },
  { value: 'Homologação', label: 'Homologação' },
  { value: 'Dev', label: 'Dev' },
  { value: 'Local', label: 'Local' },
];
const frequencias = [
  { value: 'Sempre', label: 'Sempre' },
  { value: 'Intermitente', label: 'Intermitente' },
  { value: 'Raro', label: 'Raro' },
];

const campos = [
  { name: 'titulo', label: 'Título', required: true, placeholder: 'Ex: Não é possível logar', maxLength: 80, helper: 'Resuma o problema em poucas palavras.' },
  { name: 'descricao', label: 'Descrição', required: true, multiline: true, placeholder: 'Descreva o bug detalhadamente...', helper: 'Inclua contexto, comportamento esperado e observado.' },
  { name: 'severidade', label: 'Severidade', required: true, select: true, options: severidades, helper: 'Nível de gravidade do bug.' },
  { name: 'impacto', label: 'Impacto no usuário', required: true, select: true, options: impactos, helper: 'Como o bug afeta o usuário final.' },
  { name: 'ambiente', label: 'Ambiente', required: true, select: true, options: ambientes, helper: 'Onde o bug ocorre.' },
  { name: 'frequencia', label: 'Frequência de ocorrência', required: true, select: true, options: frequencias, helper: 'Quantas vezes o bug ocorre.' },
  { name: 'area', label: 'Área do sistema', required: true, placeholder: 'Ex: Login, Dashboard...', helper: 'Módulo, tela ou funcionalidade afetada.' },
  { name: 'evidencias', label: 'Evidências', required: false, multiline: true, placeholder: 'Cole links, prints ou descreva evidências...', helper: 'Anexe ou descreva provas do bug.' },
];

const initialState = campos.reduce((acc, campo) => {
  acc[campo.name] = '';
  return acc;
}, {});


function CadastroBug({ onBugCadastrado }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [manterCampos, setManterCampos] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    try {
      const response = await api.post('/bugs/', form);
      setMensagem('Bug cadastrado com sucesso!');
      if (manterCampos) {
        // Mantém principais, limpa título, descrição e evidências
        setForm(f => ({
          ...f,
          titulo: '',
          descricao: '',
          evidencias: ''
        }));
      } else {
        setForm(initialState);
      }
      if (onBugCadastrado) onBugCadastrado(response.data, !manterCampos); // true = trocar aba, false = ficar
    } catch (error) {
      setMensagem('Erro ao cadastrar bug.');
    }
    setLoading(false);
  };

  return (
    <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 3, maxWidth: 500, mx: 'auto', bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center', mb: 3 }}>
        Cadastro de Bug
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} direction="column">
          {campos.map((campo) => (
            <Grid item xs={12} key={campo.name}>
              {campo.select ? (
                <TextField
                  select
                  fullWidth
                  label={campo.label}
                  name={campo.name}
                  value={form[campo.name]}
                  onChange={handleChange}
                  required={campo.required}
                  variant="filled"
                  sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                  placeholder={campo.placeholder}
                  inputProps={campo.maxLength ? { maxLength: campo.maxLength } : {}}
                  helperText={campo.helper}
                >
                  {campo.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label={campo.label}
                  name={campo.name}
                  value={form[campo.name]}
                  onChange={handleChange}
                  required={campo.required}
                  multiline={!!campo.multiline}
                  minRows={campo.multiline ? 3 : 1}
                  variant="filled"
                  sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                  placeholder={campo.placeholder}
                  inputProps={campo.maxLength ? { maxLength: campo.maxLength } : {}}
                  // FormHelperTextProps removido
                  // onFocus/onBlur removidos
                  helperText={campo.helper}
                />
              )}
            </Grid>
          ))}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={manterCampos} onChange={e => setManterCampos(e.target.checked)} color="primary" />}
              label="Cadastrar outro bug semelhante"
              sx={{ mb: 1, userSelect: 'none' }}
            />
            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading} sx={{ minWidth: 180, fontWeight: 600 }}>
              {loading ? 'Salvando...' : 'Cadastrar Bug'}
            </Button>
          </Grid>
          {mensagem && (
            <Grid item xs={12}>
              <Typography sx={{ mt: 2, textAlign: 'center' }} color={mensagem.includes('sucesso') ? 'primary' : 'error'}>
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
