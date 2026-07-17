# ⚔️ Aliança Skyline — Bot Discord

Bot completo para a aliança, com sistema de níveis, tickets, sorteios, eventos, polls, moderação e muito mais. Tema roxo `#9b59b6`.

---

## 🚀 Deploy no Railway

### 1. Variáveis de ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `TOKEN` | Token do bot (Discord Developer Portal) | ✅ |
| `CLIENT_ID` | ID da aplicação Discord | ✅ |
| `GUILD_ID` | ID do servidor (para registro de slash commands) | ✅ |
| `DATABASE_URL` | URL do banco PostgreSQL | ✅ |
| `OWNER_ID` | ID do dono do bot (`1195254699943796791`) | ✅ |

### 2. Configurar banco de dados

No Railway, adicione um serviço **PostgreSQL** e copie a `DATABASE_URL`.

### 3. Deploy

```bash
# No Railway, o start command já está configurado em railway.json:
# npm run db:push && npm run start
```

> ⚠️ O bot usa `prisma db push` (não migrate deploy) para criar as tabelas. Isso é intencional.

---

## 🛠️ Desenvolvimento local

```bash
# 1. Clone o repositório
git clone https://github.com/KILLZINs/alianca-skyline-bot.git
cd alianca-skyline-bot

# 2. Instale as dependências
npm install

# 3. Copie e edite o .env
cp .env.example .env

# 4. Crie as tabelas no banco
npm run db:push

# 5. Registre os slash commands no servidor
npm run deploy

# 6. Inicie o bot
npm run dev
```

---

## 📋 Comandos disponíveis

### 🎮 Geral
| Comando | Descrição |
|---------|-----------|
| `/painel` | Painel principal (perfil, nível, ranking, tickets, sorteios, eventos) |
| `/ping` | Latência do bot |
| `/serverinfo` | Informações do servidor |

### 👤 Membros
| Comando | Descrição |
|---------|-----------|
| `/perfil [usuario]` | Perfil completo (rank, nível, XP, moedas, conquistas) |
| `/nivel [usuario]` | Nível e XP detalhado |
| `/leaderboard` | Top 10 por nível |
| `/rank definir <usuario> <rank>` | Define o rank manualmente (admin) |
| `/rank lista` | Lista os ranks disponíveis |

### 🎫 Tickets
| Comando | Descrição |
|---------|-----------|
| `/ticket painel [canal]` | Envia painel de criação de tickets (admin) |

### 🛡️ Moderação
| Comando | Descrição |
|---------|-----------|
| `/moderacao ban <usuario> <motivo>` | Bane um membro |
| `/moderacao kick <usuario> <motivo>` | Expulsa um membro |
| `/moderacao mute <usuario> <duracao> <motivo>` | Muta com timeout |
| `/moderacao unmute <usuario>` | Remove o mute |
| `/moderacao warn <usuario> <motivo>` | Adverte um membro |
| `/moderacao warns <usuario>` | Lista os avisos |
| `/moderacao limpar <qtd>` | Apaga mensagens em massa |

### 🎁 Sorteios
| Comando | Descrição |
|---------|-----------|
| `/giveaway criar <premio> <vencedores> <duracao>` | Cria sorteio (admin) |
| `/giveaway encerrar <id>` | Encerra sorteio (admin) |

### 📊 Polls
| Comando | Descrição |
|---------|-----------|
| `/poll criar <pergunta> <opcao1> <opcao2> [...]` | Cria enquete (admin) |

### 📌 Eventos
| Comando | Descrição |
|---------|-----------|
| `/evento criar <titulo> <desc> <quando>` | Cria evento (admin) |
| `/evento encerrar <id>` | Encerra evento (admin) |

### 📣 Utilitários
| Comando | Descrição |
|---------|-----------|
| `/anuncio` | Envia anúncio no canal configurado (admin) |
| `/feedback` | Envia feedback para a equipe |
| `/sugestao` | Envia sugestão para o servidor |

### 🏆 Recompensas
| Comando | Descrição |
|---------|-----------|
| `/conquista criar <nome> <desc> <xp> [moedas]` | Cria conquista (admin) |
| `/conquista dar <usuario> <nome>` | Concede conquista (admin) |
| `/conquista ver [usuario]` | Vê conquistas de um membro |
| `/recompensa dar <usuario> <qtd>` | Dá moedas (admin) |
| `/recompensa remover <usuario> <qtd>` | Remove moedas (admin) |
| `/recompensa ver [usuario]` | Vê saldo de moedas |

### ⚙️ Admin
| Comando | Descrição |
|---------|-----------|
| `/admin` | Painel de administração (config, mod, anúncio, poll, evento, sorteio, rank) |
| `/config` | Visualiza e edita a configuração do bot |

---

## ⚙️ Configuração inicial (após deploy)

1. Use `/ticket painel` num canal para publicar o painel de tickets
2. Use `/admin` → **Configurações** para definir canais e cargos
3. Use `/painel` num canal público para publicar o painel principal

---

## 🏅 Sistema de Ranks

| Rank | Nível mínimo |
|------|-------------|
| Recruta | 0 |
| Membro | 5 |
| Veterano | 15 |
| Elite | 30 |
| Capitão | 50 |
| Comandante | 75 |
| Líder | Manual (admin) |

---

## 📦 Tecnologias

- **Runtime:** Node.js 20 + TypeScript
- **Discord:** discord.js v14
- **Database:** PostgreSQL + Prisma ORM
- **Scheduler:** node-cron (finaliza sorteios automaticamente)
- **Deploy:** Railway
