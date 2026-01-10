import { useEffect, useState } from 'react';
import api from './axios';

export default function usePerfil() {
  const [perfil, setPerfil] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPerfil('');
      setUsuario(null);
      setLoading(false);
      return;
    }
    async function fetchPerfil() {
      setLoading(true);
      try {
        const res = await api.get('/me');
        setPerfil(res.data.perfil);
        setUsuario(res.data);
      } catch {
        setPerfil('');
        setUsuario(null);
      }
      setLoading(false);
    }
    fetchPerfil();
  }, [localStorage.getItem('token')]);

  return { perfil, usuario, loading };
}
