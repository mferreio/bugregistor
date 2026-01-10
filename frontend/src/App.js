import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import CadastroBug from './CadastroBug';
import FilaBugs from './FilaBugs';
import PerfilSelector from './PerfilSelector';

function App() {
  const [perfil, setPerfil] = useState('qa');
  return (
    <Container maxWidth="md" style={{ marginTop: 40 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Sistema de Gestão de Bugs
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary">
        Priorize e visualize bugs de forma inteligente e colaborativa
      </Typography>
      <PerfilSelector perfil={perfil} setPerfil={setPerfil} />
      <CadastroBug />
      <FilaBugs perfil={perfil} />
    </Container>
  );
}

export default App;
