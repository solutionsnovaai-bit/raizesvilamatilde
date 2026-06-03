# Portal Raízes Vila Matilde — Portal do Síndico

Portal de gestão condominial com upload de documentos, assistente de IA
(legislação condominial), histórico e dashboard.

## Stack
- React 18 + Vite + TypeScript
- Vercel Serverless Functions (`/api`)
- Gemini 2.0 Flash (chat) com fallback Groq (Llama 3.3 70B)
- Nodemailer (envio de e-mail)

---

## ⚠️ Variáveis de ambiente (OBRIGATÓRIO no Vercel)

As chaves NÃO ficam no código. Configure em **Vercel → Settings → Environment Variables**:

| Variável     | Para que serve                          |
|--------------|------------------------------------------|
| `GEMINI_KEY` | Chave Google AI (chat IA)                |
| `GROQ_KEY`   | Chave Groq (fallback do chat)            |
| `EMAIL_FROM` | Gmail remetente                          |
| `EMAIL_PASS` | **App Password** do Gmail (não a senha!) |
| `EMAIL_TO`   | E-mail que recebe os documentos          |

> O Gmail exige uma **App Password** (Conta Google → Segurança → Senhas de app),
> não a senha normal da conta.

Veja `.env.example` como referência.

---

## Rodar local

```bash
npm install
# crie um arquivo .env com as variáveis acima (não commitar!)
npm run dev
```

> Obs: as rotas `/api/*` só funcionam de verdade no Vercel
> (ou via `vercel dev`). No `npm run dev` puro, o chat e o envio
> de e-mail vão falhar — é esperado.

## Deploy

```bash
npm run build   # valida tipos + gera dist
```

Depois é só dar push no GitHub — o Vercel builda sozinho.
**Antes do primeiro deploy, configure as Environment Variables.**

---

## 🔐 Importante sobre segurança

- Se as chaves antigas (Gemini/Groq) já foram commitadas alguma vez,
  **rotacione/revogue elas** — considere queimadas.
- O login (`sindico` / `vilamatilde`) é validado no front e serve só
  como barreira simples de demo. Não é segurança real — qualquer pessoa
  com acesso ao app consegue ver as credenciais no código compilado.
  Para um portal sério, mova a autenticação para o servidor.
- O Histórico e o Dashboard usam dados de exemplo (mock) para visualização.
