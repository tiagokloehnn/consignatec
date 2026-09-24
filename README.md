# Consignatec - Gestão Financeira & Orçamento Pessoal

Ferramenta corporativa de planejamento financeiro, orçamento por metas e controle de despesas para clientes e colaboradores da **Consignatec** (`consignatec.com.br`).

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- Node.js versão 18 ou superior instalado.
- Gerenciador de pacotes npm.

### 2. Instalação das Dependências
No terminal da pasta do projeto, execute:
```bash
npm install
```

### 3. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (copiando o `.env.example`):
```bash
cp .env.example .env
```

Preencha com suas chaves:
```env
# Chave da API Gemini (IA)
CONSIGNATEC_GEMINI_KEY="sua_chave_gemini_aqui"
# ou GEMINI_API_KEY="sua_chave_gemini_aqui"

# Supabase (Banco de dados na nuvem e autenticação)
VITE_CONSIGNATEC_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_CONSIGNATEC_SUPABASE_ANON_KEY="sua_chave_anonima_supabase"
```

### 4. Executando em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: `http://localhost:3000`

### 5. Compilando para Produção (Build)
```bash
npm run build
```
Os arquivos otimizados prontos para publicação estarão na pasta `dist/`.

---

## 🌐 Publicação (Deploy) em Domínio Próprio ou Vercel

1. Suba esta pasta para um repositório no seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Adicione as variáveis de ambiente:
   - `VITE_CONSIGNATEC_SUPABASE_URL`
   - `VITE_CONSIGNATEC_SUPABASE_ANON_KEY`
   - `CONSIGNATEC_GEMINI_KEY`
4. Clique em **Deploy**.
5. Em **Settings > Domains**, aponte o seu domínio `consignatec.com.br` ou subdomínio `app.consignatec.com.br`.

---

## 💻 Como Embutir no site `consignatec.com.br` (Opção 2 - iFrame)

Em qualquer página do seu site WordPress, Wix, HTML ou institucional, cole o código:

```html
<div style="width: 100%; min-height: 90vh; position: relative; overflow: hidden; background: #f8fafc;">
  <iframe
    src="https://ais-pre-zmlgcqt7sndge4qkb5htrw-684927775606.us-west2.run.app"
    title="Consignatec - Gestão Financeira & Orçamento"
    style="width: 100%; height: 92vh; border: none; display: block;"
    allow="clipboard-write; camera; microphone"
    loading="lazy">
  </iframe>
</div>
```
