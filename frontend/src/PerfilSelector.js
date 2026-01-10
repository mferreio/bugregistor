import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup, Typography, Box } from '@mui/material';

const perfis = [
  { value: 'qa', label: 'QA' },
  { value: 'dev', label: 'Dev' },
  { value: 'po', label: 'PO' },
];

function PerfilSelector({ perfil, setPerfil }) {
  return (
    <Box mb={2} display="flex" flexDirection="column" alignItems="center">
      <Typography variant="subtitle2" gutterBottom>
        Visualizar como:
      </Typography>
      <ToggleButtonGroup
        value={perfil}
        exclusive
        onChange={(_, novoPerfil) => novoPerfil && setPerfil(novoPerfil)}
        aria-label="Seleção de perfil"
      >
        {perfis.map((p) => (
          <ToggleButton key={p.value} value={p.value} aria-label={p.label}>
            {p.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export default PerfilSelector;
