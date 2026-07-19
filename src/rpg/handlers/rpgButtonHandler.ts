// ═══════════════════════════════════════════════════════════════════════
// HANDLER DE BOTÕES RPG
// ═══════════════════════════════════════════════════════════════════════

import { ButtonInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../../database/client';
import { getOrCreateCharacter, computeStats, getCharacter, applyPassiveEnergyRegen } from '../services/character';
import { buildProfileEmbed, buildProfileButtons, buildCidadeEmbed, buildCidadeButtons, buildCidadeButtons2, buildPontosEmbed, buildPontosSelect } from '../panels/profile';
import { buildTravelEmbed, buildTravelSelect, buildTravelBackButton } from '../panels/travel';
import { buildDungeonEmbed, buildDungeonSelect, buildDungeonButtons, doBattleRandom } from '../panels/dungeon';
import { buildShopEmbed, buildShopCategorySelect, buildShopButtons } from '../panels/shop';
import { buildGuildMenuEmbed, buildGuildMenuButtons, buildGuildInfoEmbed, buildGuildInfoButtons, buildGuildListEmbed, criarGuildaModal, guildConfigModal, guildDepositarModal, guildAnuncioModal, leaveGuild } from '../panels/guild';
import { buildHabilidadesEmbed, buildHabilidadesButtons } from '../panels/skills';
import { buildInventarioEmbed, buildInventarioButtons } from '../panels/inventario';
import { errorEmbed, infoEmbed, successEmbed } from '../../utils/embeds';

// ─── Router principal ──────────────────────────────────────────────────────

export async function handleRpgButton(i: ButtonInteraction, action: string): Promise<void> {
  const discordId = i.user.id;
  const username  = i.user.username;

  // Extrair parâmetros extras (ex: rpg:casamento_aceitar:proposalId)
  const fullAction = i.customId.split(':').slice(1).join(':'); // tudo após prefix "rpg:"
  const parts      = fullAction.split(':');
  const baseAction = parts[0];
  const param1     = parts[1];

  try {
    switch (baseAction) {

      // ── Perfil ────────────────────────────────────────────────────────────
      case 'perfil': {
        await i.deferUpdate();
        let char = await getOrCreateCharacter(discordId, username);
        char = await applyPassiveEnergyRegen(char);
        const stats = computeStats(char);
        await i.editReply({
          embeds: [buildProfileEmbed(char, stats)],
          components: buildProfileButtons(char),
        });
        break;
      }

      // ── Viajar ────────────────────────────────────────────────────────────
      case 'viajar': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const select = buildTravelSelect(char);
        await i.editReply({
          embeds: [buildTravelEmbed(char)],
          components: select ? [select, buildTravelBackButton()] : [buildTravelBackButton()],
        });
        break;
      }

      // ── Inventário ────────────────────────────────────────────────────────
      case 'inventario': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const { embed, select } = await buildInventarioEmbed(char);
        const rows = select ? [select, buildInventarioButtons()] : [buildInventarioButtons()];
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      // ── Pontos de atributo ────────────────────────────────────────────────
      case 'pontos': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const stats = computeStats(char);
        await i.editReply({
          embeds: [buildPontosEmbed(char, stats)],
          components: [buildPontosSelect(char.statPoints)],
        });
        break;
      }

      // ── Cidade ────────────────────────────────────────────────────────────
      case 'cidade': {
        await i.deferUpdate();
        await i.editReply({
          embeds: [buildCidadeEmbed()],
          components: [buildCidadeButtons(), buildCidadeButtons2()],
        });
        break;
      }

      // ── Dungeon ───────────────────────────────────────────────────────────
      case 'dungeon': {
        await i.deferUpdate();
        let char = await getOrCreateCharacter(discordId, username);
        char = await applyPassiveEnergyRegen(char);
        const select = buildDungeonSelect(char);
        await i.editReply({
          embeds: [buildDungeonEmbed(char)],
          components: select ? [select, buildDungeonButtons(char)] : [buildDungeonButtons(char)],
        });
        break;
      }

      // ── Batalha rápida aleatória ──────────────────────────────────────────
      case 'dungeon_aleatorio': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        if (char.currentHp <= 0) {
          await i.editReply({ embeds: [errorEmbed('Sem HP', 'Você está sem HP! Vá à cidade e se cure primeiro.')], components: [] });
          return;
        }
        if (char.currentEnergy < 10) {
          await i.editReply({ embeds: [errorEmbed('Sem Energia ⚡', `Você tem apenas **${char.currentEnergy}** de energia — mínimo para batalhar é **10**.\nVá à 🏰 Cidade → 🏥 Curar para restaurar energia.`)], components: [] });
          return;
        }
        const { embed: battleEmbed, rows: battleRows } = await doBattleRandom(char);

        // Track missão RPG: matar inimigos
        try {
          const { trackRpgMission } = await import('../../commands/utility/missoes');
          await trackRpgMission(discordId, i.guildId ?? '', 'matar_inimigos', 1);
          await trackRpgMission(discordId, i.guildId ?? '', 'vencer_dungeon', 1);
        } catch { /* non-critical */ }

        await i.editReply({ embeds: [battleEmbed], components: battleRows });
        break;
      }

      // ── Boss dungeon ──────────────────────────────────────────────────────
      case 'dungeon_boss': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        if (char.currentHp <= 0) {
          await i.editReply({ embeds: [errorEmbed('Sem HP', 'Você está sem HP! Vá à cidade e se cure primeiro.')], components: [] });
          return;
        }
        if (char.currentEnergy < 10) {
          await i.editReply({ embeds: [errorEmbed('Sem Energia ⚡', `Você tem apenas **${char.currentEnergy}** de energia — mínimo para batalhar é **10**.\nVá à 🏰 Cidade → 🏥 Curar para restaurar energia.`)], components: [] });
          return;
        }
        const { getBossesForLocation } = await import('../constants/enemies');
        const { getLocation } = await import('../constants/locations');
        const loc = getLocation(char.currentLocation);
        const bosses = getBossesForLocation(loc.id).filter(b => char.level >= b.minLevel);
        if (bosses.length === 0) {
          await i.editReply({ embeds: [errorEmbed('Sem Boss', 'Nenhum boss disponível aqui no seu nível.')] });
          return;
        }
        const boss = bosses[0];
        const { doBattleEnemy } = await import('../panels/dungeon');
        const { embed: bossEmbed, rows: bossRows } = await doBattleEnemy(char, boss.id);

        // Track boss kill mission
        try {
          const { trackRpgMission } = await import('../../commands/utility/missoes');
          await trackRpgMission(discordId, i.guildId ?? '', 'matar_boss_rpg', 1);
          await trackRpgMission(discordId, i.guildId ?? '', 'matar_inimigos', 1);
        } catch { /* non-critical */ }

        await i.editReply({ embeds: [bossEmbed], components: bossRows });
        break;
      }

      // ── Habilidades ───────────────────────────────────────────────────────
      case 'habilidades': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const { embed, select } = buildHabilidadesEmbed(char);
        const rows = select ? [select, buildHabilidadesButtons(char)] : [buildHabilidadesButtons(char)];
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      // ── Loja ──────────────────────────────────────────────────────────────
      case 'loja': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        await i.editReply({
          embeds: [buildShopEmbed(char)],
          components: [buildShopCategorySelect(), buildShopButtons()],
        });
        break;
      }

      // ── Curandeiro ────────────────────────────────────────────────────────
      case 'curandeiro': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const stats = computeStats(char);
        const hpMissing = stats.maxHp - char.currentHp;
        const enMissing = stats.maxEnergy - char.currentEnergy;
        const cost = Math.floor((hpMissing + enMissing) * 0.5);

        if (hpMissing === 0 && enMissing === 0) {
          await i.editReply({ embeds: [infoEmbed('🏥 Curandeiro', '✅ Você já está com HP e Energia no máximo!')], components: [buildCidadeButtons(), buildCidadeButtons2()] });
          return;
        }
        if (char.gold < cost) {
          await i.editReply({ embeds: [errorEmbed('🏥 Ouro Insuficiente', `Curar custa **${cost} ouro**.\nVocê tem apenas **${char.gold} ouro**.\n\n❤️ HP faltando: **${hpMissing}** | ⚡ Energia faltando: **${enMissing}**`)], components: [buildCidadeButtons(), buildCidadeButtons2()] });
          return;
        }

        await prisma.rpgCharacter.update({
          where: { discordId },
          data: { currentHp: stats.maxHp, currentEnergy: stats.maxEnergy, gold: { decrement: cost }, lastRest: new Date() },
        });

        await i.editReply({
          embeds: [infoEmbed('🏥 Curado!', `HP e Energia restaurados por **${cost} ouro**.\n❤️ HP: **${stats.maxHp}/${stats.maxHp}** | ⚡ Energia: **${stats.maxEnergy}/${stats.maxEnergy}**`)],
          components: [buildCidadeButtons(), buildCidadeButtons2()],
        });
        break;
      }

      // ── Arena PvP ─────────────────────────────────────────────────────────
      case 'arena': {
        await i.deferUpdate();
        await i.editReply({
          embeds: [infoEmbed('⚔️ Arena PvP', 'Para desafiar alguém, use:\n`/rpg pvp @usuario`\n\nOu aguarde oponentes aleatórios no canal de arena.')],
          components: [buildCidadeButtons(), buildCidadeButtons2()],
        });
        break;
      }

      // ── Guilda ────────────────────────────────────────────────────────────
      case 'guild': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        await i.editReply({ embeds: [buildGuildMenuEmbed(char)], components: [buildGuildMenuButtons(!!membership)] });
        break;
      }

      case 'guild_info': {
        await i.deferUpdate();
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        if (!membership) { await i.editReply({ embeds: [errorEmbed('Sem Guilda', 'Você não está em nenhuma guilda.')] }); return; }
        await i.editReply({ embeds: [await buildGuildInfoEmbed(membership.guildId)], components: buildGuildInfoButtons(membership.role) });
        break;
      }

      case 'guild_config': {
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        if (!membership || (membership.role !== 'Líder' && membership.role !== 'Vice-Líder')) {
          if (i.deferred || i.replied) await i.editReply({ embeds: [errorEmbed('Sem Permissão', 'Apenas Líder ou Vice-Líder podem configurar.')] });
          else await i.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas Líder ou Vice-Líder podem configurar.')], ephemeral: true });
          return;
        }
        await i.showModal(guildConfigModal());
        break;
      }

      case 'guild_depositar': {
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        if (!membership) {
          if (i.deferred || i.replied) await i.editReply({ embeds: [errorEmbed('Sem Guilda', 'Você não está em nenhuma guilda.')] });
          else await i.reply({ embeds: [errorEmbed('Sem Guilda', 'Você não está em nenhuma guilda.')], ephemeral: true });
          return;
        }
        await i.showModal(guildDepositarModal());
        break;
      }

      case 'guild_anuncio': {
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        if (!membership || (membership.role !== 'Líder' && membership.role !== 'Vice-Líder')) {
          if (i.deferred || i.replied) await i.editReply({ embeds: [errorEmbed('Sem Permissão', 'Apenas Líder ou Vice-Líder podem definir o aviso.')] });
          else await i.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas Líder ou Vice-Líder podem definir o aviso.')], ephemeral: true });
          return;
        }
        await i.showModal(guildAnuncioModal());
        break;
      }

      case 'guild_criar': { await i.showModal(criarGuildaModal()); break; }

      case 'guild_buscar': {
        await i.deferUpdate();
        await i.editReply({ embeds: [await buildGuildListEmbed()], components: [buildGuildMenuButtons(false)] });
        break;
      }

      case 'guild_sair': {
        await i.deferUpdate();
        const result = await leaveGuild(discordId);
        await i.editReply({ embeds: [result.success ? successEmbed('Guilda', result.message) : errorEmbed('Erro', result.message)] });
        break;
      }

      // ── Forja ─────────────────────────────────────────────────────────────
      case 'forja': {
        await i.deferUpdate();
        const { buildForjaEmbed } = await import('../panels/forja');
        const char = await getOrCreateCharacter(discordId, username);
        const { embed, select } = buildForjaEmbed(char);
        await i.editReply({
          embeds: [embed],
          components: select ? [select, buildCidadeButtons(), buildCidadeButtons2()] : [buildCidadeButtons(), buildCidadeButtons2()],
        });
        break;
      }

      // ══════════════════════════════════════════════════════════════════════
      // 🐉 BOSS MUNDIAL
      // ══════════════════════════════════════════════════════════════════════

      case 'worldboss': {
        await i.deferUpdate();
        const { buildWorldBossEmbed, buildWorldBossButtons } = await import('../panels/worldBoss');
        const guildId = i.guildId ?? '';
        const member = i.member;
        const isAdmin = !!(member && 'permissions' in member && (member.permissions as any).has?.(PermissionFlagsBits.ManageGuild));
        const [bossEmbed, bossButtons] = await Promise.all([
          buildWorldBossEmbed(guildId),
          buildWorldBossButtons(guildId, isAdmin),
        ]);
        await i.editReply({ embeds: [bossEmbed], components: bossButtons });
        break;
      }

      case 'worldboss_atacar': {
        await i.deferUpdate();
        const { attackWorldBoss } = await import('../services/worldBoss');
        const { buildWorldBossEmbed, buildWorldBossButtons } = await import('../panels/worldBoss');
        const guildId = i.guildId ?? '';
        const result = await attackWorldBoss(discordId, username, guildId);

        if (!result.success) {
          await i.editReply({ embeds: [errorEmbed('Boss Mundial', result.message)] });
          return;
        }

        // Track missão de atacar boss mundial
        try {
          const { trackRpgMission } = await import('../../commands/utility/missoes');
          await trackRpgMission(discordId, guildId, 'atacar_boss_mundial', 1);
          await trackRpgMission(discordId, guildId, 'participar_boss_mundial', 1);
        } catch { /* non-critical */ }

        const member = i.member;
        const isAdmin = !!(member && 'permissions' in member && (member.permissions as any).has?.(PermissionFlagsBits.ManageGuild));
        const [updatedBossEmbed, updatedButtons] = await Promise.all([
          buildWorldBossEmbed(guildId),
          buildWorldBossButtons(guildId, isAdmin),
        ]);

        const attackResult = infoEmbed(
          result.bossDefeated ? '🏆 Boss Derrotado!' : '⚔️ Ataque!',
          result.message,
        );

        await i.followUp({ embeds: [attackResult], ephemeral: true });
        await i.editReply({ embeds: [updatedBossEmbed], components: updatedButtons });
        break;
      }

      case 'worldboss_spawn': {
        // Verificar admin
        const member = i.member;
        const isAdmin = !!(member && 'permissions' in member && (member.permissions as any).has?.(PermissionFlagsBits.ManageGuild));
        if (!isAdmin) {
          await i.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas administradores podem invocar o Boss Mundial.')], ephemeral: true });
          return;
        }
        // Mostrar seleção de template
        await i.deferUpdate();
        const { buildWorldBossSpawnSelect } = await import('../panels/worldBoss');
        const { EmbedBuilder } = await import('discord.js');
        const spawnEmbed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('🐉 Invocar Boss Mundial — Passo 1')
          .setDescription('Escolha qual Boss Mundial deseja invocar para o servidor!');
        await i.editReply({ embeds: [spawnEmbed], components: [buildWorldBossSpawnSelect()] });
        break;
      }

      // ══════════════════════════════════════════════════════════════════════
      // 💍 CASAMENTO
      // ══════════════════════════════════════════════════════════════════════

      case 'casamento': {
        await i.deferUpdate();
        const { buildMarriageEmbed, buildMarriageButtons } = await import('../panels/marriage');
        const [marriageEmbed, marriageButtons] = await Promise.all([
          buildMarriageEmbed(discordId, i.client),
          buildMarriageButtons(discordId),
        ]);
        await i.editReply({ embeds: [marriageEmbed], components: marriageButtons });
        break;
      }

      case 'casamento_propor': {
        const { buildProposalModal } = await import('../panels/marriage');
        await i.showModal(buildProposalModal());
        break;
      }

      case 'casamento_aceitar': {
        await i.deferUpdate();
        const proposalId = param1;
        if (!proposalId) { await i.editReply({ embeds: [errorEmbed('Erro', 'ID da proposta inválido.')] }); return; }

        const { acceptProposal } = await import('../services/marriage');
        const result = await acceptProposal(proposalId, discordId);

        // Notificar via DM o proponente
        if (result.success && result.proposerId) {
          try {
            const proposerUser = await i.client.users.fetch(result.proposerId);
            await proposerUser.send(`💍 **${i.user.username}** aceitou sua proposta de casamento! 💒🎊`);
          } catch { /* DMs fechadas */ }
        }

        const { buildMarriageEmbed, buildMarriageButtons } = await import('../panels/marriage');
        const [marriageEmbed, marriageButtons] = await Promise.all([
          buildMarriageEmbed(discordId, i.client),
          buildMarriageButtons(discordId),
        ]);
        const feedbackEmbed = result.success ? successEmbed('💒 Casamento!', result.message) : errorEmbed('Erro', result.message);
        await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
        break;
      }

      case 'casamento_rejeitar': {
        await i.deferUpdate();
        const proposalId = param1;
        if (!proposalId) { await i.editReply({ embeds: [errorEmbed('Erro', 'ID da proposta inválido.')] }); return; }

        const { rejectProposal } = await import('../services/marriage');
        const result = await rejectProposal(proposalId, discordId);

        const { buildMarriageEmbed, buildMarriageButtons } = await import('../panels/marriage');
        const [marriageEmbed, marriageButtons] = await Promise.all([
          buildMarriageEmbed(discordId, i.client),
          buildMarriageButtons(discordId),
        ]);
        const feedbackEmbed = result.success ? infoEmbed('💔 Proposta Recusada', result.message) : errorEmbed('Erro', result.message);
        await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
        break;
      }

      case 'casamento_divorciar_confirmar': {
        await i.deferUpdate();
        const { buildDivorceConfirmEmbed } = await import('../panels/marriage');
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('rpg:casamento_divorciar_executar').setLabel('💔 Confirmar Divórcio').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('rpg:casamento').setLabel('❌ Cancelar').setStyle(ButtonStyle.Secondary),
        );
        await i.editReply({ embeds: [buildDivorceConfirmEmbed()], components: [confirmRow] });
        break;
      }

      case 'casamento_divorciar_executar': {
        await i.deferUpdate();
        const { divorce } = await import('../services/marriage');
        const result = await divorce(discordId);

        const { buildMarriageEmbed, buildMarriageButtons } = await import('../panels/marriage');
        const [marriageEmbed, marriageButtons] = await Promise.all([
          buildMarriageEmbed(discordId, i.client),
          buildMarriageButtons(discordId),
        ]);
        const feedbackEmbed = result.success ? infoEmbed('💔 Divórcio', result.message) : errorEmbed('Erro', result.message);
        await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
        break;
      }

      // ══════════════════════════════════════════════════════════════════════
      // 📋 MISSÕES
      // ══════════════════════════════════════════════════════════════════════

      case 'missoes': {
        await i.deferUpdate();
        const guildId = i.guildId ?? '';
        const { ensureDailyMissions, ensureWeeklyMissions } = await import('../../commands/utility/missoes');
        const { buildMissoesEmbed, buildMissoesClaimSelect, buildMissoesButtons } = await import('../panels/missoes');

        await Promise.all([
          ensureDailyMissions(discordId, guildId),
          ensureWeeklyMissions(discordId, guildId),
        ]);

        const [missoesEmbed, claimSelect] = await Promise.all([
          buildMissoesEmbed(discordId, guildId),
          buildMissoesClaimSelect(discordId, guildId),
        ]);

        const missaoRows: any[] = claimSelect ? [claimSelect, buildMissoesButtons()] : [buildMissoesButtons()];
        await i.editReply({ embeds: [missoesEmbed], components: missaoRows });
        break;
      }

      // ── Estatísticas do Personagem ────────────────────────────────────────
      case 'stats': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const stats = computeStats(char);
        const totalBattles = char.totalWins + char.totalDeaths;
        const winRate = totalBattles > 0 ? Math.round((char.totalWins / totalBattles) * 100) : 0;
        const daysPlaying = Math.floor((Date.now() - char.createdAt.getTime()) / 86400000);
        const pvpTotal = char.pvpWins + char.pvpLosses;
        const pvpRate = pvpTotal > 0 ? Math.round((char.pvpWins / pvpTotal) * 100) : 0;

        const { EmbedBuilder: StatsEB, ActionRowBuilder: StatsAR, ButtonBuilder: StatsBB, ButtonStyle: StatsBS } = await import('discord.js');
        const { getClass: getClsStats } = await import('../constants/classes');
        const clsStats = getClsStats(char.class);

        const statsEmbed = new StatsEB()
          .setColor(clsStats?.color ?? 0x2ECC71)
          .setTitle(`📊 Estatísticas — ${char.username}`)
          .setDescription(`${clsStats?.emoji ?? '⚔️'} **${clsStats?.name ?? char.class}** • Nível **${char.level}** • Geração **${char.generation}**`)
          .addFields(
            {
              name: '⚔️ Batalhas PvE',
              value: [
                `Total: **${totalBattles}** batalhas`,
                `Vitórias: **${char.totalWins}** | Derrotas: **${char.totalDeaths}**`,
                `Taxa de vitória: **${winRate}%**`,
              ].join('\n'),
              inline: true,
            },
            {
              name: '👹 Monstros',
              value: `Mortos: **${char.totalKills}**\nBosses: **${char.bossKills}**`,
              inline: true,
            },
            {
              name: '⚔️ PvP',
              value: `Vitórias: **${char.pvpWins}** / Derrotas: **${char.pvpLosses}**\nTaxa PvP: **${pvpRate}%**`,
              inline: true,
            },
            {
              name: '📈 Poder de Combate',
              value: `**${stats.combatPower.toLocaleString('pt-BR')}** PC`,
              inline: true,
            },
            {
              name: '💰 Ouro em Carteira',
              value: `**${char.gold.toLocaleString('pt-BR')}**`,
              inline: true,
            },
            {
              name: '📅 Na Aliança há',
              value: `**${daysPlaying}** dia(s)`,
              inline: true,
            },
          )
          .setFooter({ text: `⚔️ Aliança Skyline RPG • Desde: ${char.createdAt.toISOString().slice(0, 10)}` });

        await i.editReply({
          embeds: [statsEmbed],
          components: [new StatsAR<StatsBB>().addComponents(
            new StatsBB().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(StatsBS.Secondary),
            new StatsBB().setCustomId('rpg:stats').setLabel('🔄 Atualizar').setStyle(StatsBS.Secondary),
          )],
        });
        break;
      }

      default:
        if (i.deferred || i.replied) {
          await i.editReply({ embeds: [errorEmbed('Ação desconhecida', `Ação RPG \`${baseAction}\` não encontrada.`)] });
        } else {
          await i.reply({ embeds: [errorEmbed('Ação desconhecida', `Ação RPG \`${baseAction}\` não encontrada.`)], ephemeral: true });
        }
    }
  } catch (err) {
    console.error(`[RPG Button Error] action=${baseAction}`, err);
    const errMsg = { embeds: [errorEmbed('Erro RPG', 'Ocorreu um erro. Tente novamente.')] };
    if (i.replied) await i.followUp({ ...errMsg, ephemeral: true }).catch(() => null);
    else if (i.deferred) await i.editReply(errMsg).catch(() => null);
    else await i.reply({ ...errMsg, ephemeral: true }).catch(() => null);
  }
}
