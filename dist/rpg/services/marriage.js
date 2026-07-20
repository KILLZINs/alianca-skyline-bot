"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE CASAMENTO — propor, aceitar, rejeitar, divorciar
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarriage = getMarriage;
exports.getPartner = getPartner;
exports.getPendingProposals = getPendingProposals;
exports.proposeMarriage = proposeMarriage;
exports.acceptProposal = acceptProposal;
exports.rejectProposal = rejectProposal;
exports.divorce = divorce;
exports.expireOldProposals = expireOldProposals;
const client_1 = require("../../database/client");
const PROPOSAL_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
// ─── Obter casamento do usuário ────────────────────────────────────────
async function getMarriage(userId) {
    return client_1.prisma.marriage.findFirst({
        where: {
            OR: [{ userId1: userId }, { userId2: userId }],
        },
    });
}
// ─── Obter parceiro ────────────────────────────────────────────────────
function getPartner(marriage, userId) {
    return marriage.userId1 === userId ? marriage.userId2 : marriage.userId1;
}
// ─── Obter propostas recebidas pendentes ───────────────────────────────
async function getPendingProposals(targetId) {
    return client_1.prisma.marriageProposal.findMany({
        where: {
            targetId,
            status: 'pending',
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });
}
// ─── Propor casamento ─────────────────────────────────────────────────
async function proposeMarriage(proposerId, targetId, guildId) {
    if (proposerId === targetId) {
        return { success: false, message: 'Você não pode se casar consigo mesmo! 😅' };
    }
    // Verificar se já está casado
    const myMarriage = await getMarriage(proposerId);
    if (myMarriage)
        return { success: false, message: 'Você já está casado(a)! Divorce-se primeiro.' };
    const theirMarriage = await getMarriage(targetId);
    if (theirMarriage)
        return { success: false, message: 'Esta pessoa já está casada com alguém!' };
    // Verificar proposta existente
    const existing = await client_1.prisma.marriageProposal.findFirst({
        where: { proposerId, targetId, status: 'pending' },
    });
    if (existing)
        return { success: false, message: 'Você já enviou uma proposta para esta pessoa!' };
    // Verificar se o alvo também me propôs (aceitar automaticamente?)
    const reverseProposal = await client_1.prisma.marriageProposal.findFirst({
        where: { proposerId: targetId, targetId: proposerId, status: 'pending' },
    });
    if (reverseProposal) {
        // Aceitar automaticamente
        await acceptProposal(reverseProposal.id, proposerId);
        return { success: true, message: '💍 Vocês dois se propuseram mutuamente! Casamento realizado! 💕' };
    }
    await client_1.prisma.marriageProposal.create({
        data: {
            proposerId,
            targetId,
            guildId,
            status: 'pending',
            expiresAt: new Date(Date.now() + PROPOSAL_EXPIRY_MS),
        },
    });
    return { success: true, message: `💍 Proposta enviada! A pessoa tem 24 horas para aceitar via painel de Casamento.` };
}
// ─── Aceitar proposta ──────────────────────────────────────────────────
async function acceptProposal(proposalId, targetId) {
    const proposal = await client_1.prisma.marriageProposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.targetId !== targetId) {
        return { success: false, message: 'Proposta não encontrada ou não é sua.' };
    }
    if (proposal.status !== 'pending') {
        return { success: false, message: 'Esta proposta já foi respondida.' };
    }
    if (proposal.expiresAt < new Date()) {
        await client_1.prisma.marriageProposal.update({ where: { id: proposalId }, data: { status: 'expired' } });
        return { success: false, message: 'Esta proposta já expirou.' };
    }
    // Verificar se algum dos dois já se casou enquanto isso
    const [myMarriage, theirMarriage] = await Promise.all([
        getMarriage(targetId),
        getMarriage(proposal.proposerId),
    ]);
    if (myMarriage || theirMarriage) {
        await client_1.prisma.marriageProposal.update({ where: { id: proposalId }, data: { status: 'expired' } });
        return { success: false, message: 'Um dos dois já está casado com outra pessoa.' };
    }
    await client_1.prisma.$transaction([
        client_1.prisma.marriageProposal.update({ where: { id: proposalId }, data: { status: 'accepted' } }),
        client_1.prisma.marriage.create({
            data: { userId1: proposal.proposerId, userId2: targetId },
        }),
        // Expirar outras propostas pendentes dos dois
        client_1.prisma.marriageProposal.updateMany({
            where: { OR: [{ proposerId: targetId }, { targetId }], status: 'pending', id: { not: proposalId } },
            data: { status: 'expired' },
        }),
    ]);
    return { success: true, message: '💍 Casamento realizado! Felicidades! 💕', proposerId: proposal.proposerId };
}
// ─── Rejeitar proposta ─────────────────────────────────────────────────
async function rejectProposal(proposalId, targetId) {
    const proposal = await client_1.prisma.marriageProposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.targetId !== targetId) {
        return { success: false, message: 'Proposta não encontrada.' };
    }
    await client_1.prisma.marriageProposal.update({ where: { id: proposalId }, data: { status: 'rejected' } });
    return { success: true, message: '💔 Proposta recusada.' };
}
// ─── Divorciar ────────────────────────────────────────────────────────
async function divorce(userId) {
    const marriage = await getMarriage(userId);
    if (!marriage)
        return { success: false, message: 'Você não está casado(a).' };
    await client_1.prisma.marriage.delete({ where: { id: marriage.id } });
    return { success: true, message: '💔 Divórcio realizado. Você está solteiro(a) novamente.' };
}
// ─── Expirar propostas antigas ─────────────────────────────────────────
async function expireOldProposals() {
    await client_1.prisma.marriageProposal.updateMany({
        where: { status: 'pending', expiresAt: { lte: new Date() } },
        data: { status: 'expired' },
    });
}
//# sourceMappingURL=marriage.js.map