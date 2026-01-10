
# Sistema de Gestão de Bugs

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Sistema minimalista e moderno para gestão e priorização inteligente de bugs.


## Demonstração

**Frontend online:** https://bugregistor.vercel.app/
**Backend online:** https://bugregistor.onrender.com

<!-- Adicione um print ou gif do sistema aqui -->
<!-- ![screenshot](docs/screenshot.png) -->

## Tecnologias Utilizadas

- **Backend:** FastAPI (Python), SQLite
- **Frontend:** React, Material UI, MUI X DatePickers
- **Outros:** JWT, Axios, jsPDF, PapaParse

## Estrutura do Projeto

- `backend/` — API FastAPI, lógica de priorização, autenticação JWT, SQLite
- `frontend/app/` — React, interface moderna para cadastro e visualização de bugs

## Funcionalidades Principais

- Cadastro estruturado de bugs
- Fila dinâmica de prioridades baseada em critérios objetivos
- Visualização por múltiplos perfis (QA, Dev, PO)
- Repriorização automática por tempo em aberto
- Critérios e pesos configuráveis
- Exportação CSV/PDF


## Como rodar o projeto

### Acessar online

- Frontend: https://bugregistor.vercel.app/
- Backend (API): https://bugregistor.onrender.com

### Rodar localmente

#### Backend
```bash
cd backend
python -m venv .venv
# Ative o ambiente virtual:
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend/app
npm install
npm start
```

### Comandos de produção (deploy)

- O frontend está hospedado no Vercel e o backend no Render.
- Para atualizar o deploy, basta dar push na branch master do GitHub.

---

## Como contribuir

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha nova feature'`
4. Push para o fork: `git push origin minha-feature`
5. Abra um Pull Request

## Licença

MIT

---

**Desenvolvedor:**  
Matheus Ferreira de Oliveira  
Email: mferreio@emeal.nttdata.com
