// ═══════════════════════════════════════════════════════════════════════
// HANDLER DE BOTÕES RPG
// ═══════════════════════════════════════════════════════════════════════

import { ButtonInteraction } from 'discord.js';
import { prisma } from '../../database/client';
import { getOrCreateCharacter, computeStats, getCharacter, applyPassiveEnergyRegen } from '../services/character';
import { buildProfileEmbed, buildProfileButtons, buildCidadeEmbed, buildCidadeButtons, buildPontosEmbed, buildPontosSelect } from '../panels/profile';
import { buildTravelEmbed, buildTravelSelect, buildTravelBackButton } from '../panels/travel';
import { buildDungeonEmbed, buildDungeonSelect, buildDungeonButtons, doBattleRandom } from '../panels/dungeon';
import { buildShopEmbed, buildShopCategorySelect, buildShopButtons } from '../panels/shop';
import { buildGuildMenuEmbed, buildGuildMenuButtons, buildGuildInfoEmbed, buildGuildInfoButtons, buildGuildListEmbed, criarGuildaModal, guildConfigModal, guildDepositarModal, guildAnuncioModal, leaveGuild } from '../panels/guild';
import { buildHabilidadesEmbed, buildHabilidadesButtons } from '../panels/skills';
import { buildInventarioEmbed, buildInventarioButtons } from '../panels/inventario';
import { errorEmbed } from '../../utils/embeds';

// ─── Router principal ──────────────────────────────────────────────────────

export async function handleRpgButton(i: ButtonInteraction, action: string): Promise<void> {
  const discordId = i.user.id;
  const username  = i.user.username;

  try {
    switch (action) {

      // ── Perfil ────────────────────────────────────────────────────────────
      case 'perfil': {
        await i.deferUpdate();
        let char = await getOrCreateCharacter(discordId, username);
        char = await applyPassiveEnergyRegen(char); // regen passiva antes de exibir
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
        const rows = select
          ? [select, buildInventarioButtons()]
          : [buildInventarioButtons()];
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
          components: [buildCidadeButtons()],
        });
        break;
      }

      // ── Dungeon ───────────────────────────────────────────────────────────
      case 'dungeon': {
        await i.deferUpdate();
        let char = await getOrCreateCharacter(discordId, username);
        char = await applyPassiveEnergyRegen(char); // regen passiva antes de entrar
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
        const { embed, rows } = await doBattleRandom(char);
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      // ── Boss ──────────────────────────────────────────────────────────────
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
        const { embed, rows } = await doBattleEnemy(char, boss.id);
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      // ── Habilidades ───────────────────────────────────────────────────────
      case 'habilidades': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const { embed, select } = buildHabilidadesEmbed(char);
        const rows = select
          ? [select, buildHabilidadesButtons(char)]
          : [buildHabilidadesButtons(char)];
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
          await i.editReply({ embeds: [{ color: 0x27AE60, description: '✅ Você já está com HP e Energia cheios!' } as any] });
          return;
        }
        if (char.gold < cost) {
          await i.editReply({ embeds: [errorEmbed('Ouro Insuficiente', `Curar custa **${cost} ouro**. Você tem **${char.gold}**.`)] });
          return;
        }

        await prisma.rpgCharacter.update({
          where: { discordId },
          data: {
            currentHp: stats.maxHp,
            currentEnergy: stats.maxEnergy,
            gold: { decrement: cost },
            lastRest: new Date(),
          },
        });

        const { infoEmbed } = await import('../../utils/embeds');
        await i.editReply({
          embeds: [infoEmbed('🏥 Curado!', `HP e Energia restaurados por **${cost} ouro**.\n❤️ HP: **${stats.maxHp}/${stats.maxHp}** | ⚡ Energia: **${stats.maxEnergy}/${stats.maxEnergy}**`)],
          components: [buildCidadeButtons()],
        });
        break;
      }

      // ── Arena PvP ─────────────────────────────────────────────────────────
      case 'arena': {
        await i.deferUpdate();
        const { infoEmbed } = await import('../../utils/embeds');
        await i.editReply({
          embeds: [infoEmbed('⚔️ Arena PvP', 'Para desafiar alguém, mencione o usuário:\n`/rpg pvp @usuario`\n\nOu aguarde oponentes aleatórios no canal de arena.')],
          components: [buildCidadeButtons()],
        });
        break;
      }

      // ── Guilda ────────────────────────────────────────────────────────────
      case 'guild': {
        await i.deferUpdate();
        const char = await getOrCreateCharacter(discordId, username);
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        await i.editReply({
          embeds: [buildGuildMenuEmbed(char)],
          components: [buildGuildMenuButtons(!!membership)],
        });
        break;
      }

      case 'guild_info': {
        await i.deferUpdate();
        const membership = await prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
        if (!membership) {
          await i.editReply({ embeds: [errorEmbed('Sem Guilda', 'Você não está em nenhuma guilda.')] });
          return;
        }
        await i.editReply({
          embeds: [await buildGuildInfoEmbed(membership.guildId)],
          components: buildGuildInfoButtons(membership.role),
        });
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

      case 'guild_criar': {
        await i.showModal(criarGuildaModal());
        break;
      }

      case 'guild_buscar': {
        await i.deferUpdate();
        await i.editReply({ embeds: [await buildGuildListEmbed()], components: [buildGuildMenuButtons(false)] });
        break;
      }

      case 'guild_sair': {
        await i.deferUpdate();
        const result = await leaveGuild(discordId);
        const { successEmbed, errorEmbed: errEmb } = await import('../../utils/embeds');
        await i.editReply({
          embeds: [result.success ? successEmbed('Guilda', result.message) : errEmb('Erro', result.message)],
        });
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
          components: select ? [select, buildCidadeButtons()] : [buildCidadeButtons()],
        });
        break;
      }

      default:
        // BUG FIX: interação pode não ter sido deferida — usar reply com fallback
        if (i.deferred || i.replied) {
          await i.editReply({ embeds: [errorEmbed('Ação desconhecida', `Ação RPG \`${action}\` não encontrada.`)] });
        } else {
          await i.reply({ embeds: [errorEmbed('Ação desconhecida', `Ação RPG \`${action}\` não encontrada.`)], ephemeral: true });
        }
    }
  } catch (err) {
    console.error(`[RPG Button Error] action=${action}`, err);
    const errMsg = { embeds: [errorEmbed('Erro RPG', 'Ocorreu um erro. Tente novamente.')] };
    if (i.replied) await i.followUp({ ...errMsg, ephemeral: true }).catch(() => null);
    else if (i.deferred) await i.editReply(errMsg).catch(() => null);
    else await i.reply({ ...errMsg, ephemeral: true }).catch(() => null);
  }
}
