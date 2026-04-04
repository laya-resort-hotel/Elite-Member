import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';

function getCurrentUser() {
  const authUser = state.currentUser || state.auth?.currentUser || null;
  if (authUser && !state.currentUser) state.currentUser = authUser;
  return authUser;
}

function currentResidentId() {
  return state.currentResident?.residentId || state.currentResident?.memberId || state.currentResident?.id || state.residentId || '';
}

function currentMemberCode() {
  return state.currentResident?.memberCode || state.currentResident?.publicCardCode || '';
}

export async function redeemReward(rewardId) {
  const currentUser = getCurrentUser();
  if (!state.firebaseReady || !state.db || !currentUser) {
    throw new Error('Please log in before redeeming rewards');
  }

  const residentId = currentResidentId();
  if (!residentId) throw new Error('Resident profile not linked');
  if (!rewardId) throw new Error('Reward ID is required');

  const rewardRef = doc(state.db, 'reward_catalog', rewardId);
  const walletRef = doc(state.db, 'resident_wallets', residentId);
  const redemptionRef = doc(collection(state.db, 'redemptions'));
  const pointTxRef = doc(collection(state.db, 'resident_point_transactions'));

  const result = await runTransaction(state.db, async (transaction) => {
    const rewardSnap = await transaction.get(rewardRef);
    if (!rewardSnap.exists()) throw new Error('Reward not found');
    const reward = rewardSnap.data() || {};

    const pointsCost = Math.max(0, Number(reward.pointsCost || 0));
    if (!pointsCost) throw new Error('Reward points are not configured');
    if ((reward.status || 'draft') !== 'published') throw new Error('Reward is not published');
    if (reward.rewardIsActive === false) throw new Error('Reward is currently inactive');

    const stockTotal = Math.max(0, Number(reward.stockTotal || 0));
    const currentStock = stockTotal > 0
      ? Math.max(0, Number(reward.stockRemaining ?? stockTotal))
      : null;

    if (stockTotal > 0 && currentStock <= 0) {
      throw new Error('Reward is out of stock');
    }

    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists()) throw new Error('Wallet not found');
    const wallet = walletSnap.data() || {};
    const currentPoints = Math.max(0, Number(wallet.currentPoints || 0));
    if (currentPoints < pointsCost) {
      throw new Error('Not enough points');
    }

    const nextBalance = currentPoints - pointsCost;
    const nextRedeemed = Math.max(0, Number(wallet.lifetimeRedeemed || 0)) + pointsCost;
    const nextStock = stockTotal > 0 ? currentStock - 1 : null;
    const title = String(reward.title || 'Reward').trim() || 'Reward';
    const category = String(reward.rewardCategory || reward.category || '').trim();
    const imageUrl = String(reward.coverImageUrl || reward.galleryImages?.[0]?.url || '').trim();

    transaction.set(redemptionRef, {
      residentId,
      memberId: residentId,
      rewardId,
      rewardTitle: title,
      rewardCategory: category,
      rewardImageUrl: imageUrl,
      pointsCost,
      publicCardCode: state.currentResident?.publicCardCode || '',
      memberCode: currentMemberCode(),
      requestedByUid: currentUser.uid,
      requestedByEmail: currentUser.email || '',
      status: 'issued',
      source: 'resident_redemption',
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      usedAt: null,
      expiresAt: null,
    });

    transaction.set(pointTxRef, {
      residentId,
      memberCode: currentMemberCode(),
      type: 'redeem',
      pointsDelta: -pointsCost,
      balanceAfter: nextBalance,
      source: 'reward_redemption',
      sourceRefId: redemptionRef.id,
      rewardId,
      rewardTitle: title,
      createdByUid: currentUser.uid,
      createdByName: currentUser.email || currentUser.displayName || 'Resident',
      createdAt: serverTimestamp(),
      note: `Redeemed reward: ${title}`,
    });

    transaction.set(walletRef, {
      residentId,
      currentPoints: nextBalance,
      pendingPoints: Math.max(0, Number(wallet.pendingPoints || 0)),
      lifetimeEarned: Math.max(0, Number(wallet.lifetimeEarned || 0)),
      lifetimeRedeemed: nextRedeemed,
      updatedAt: serverTimestamp(),
      lastRedemptionAt: serverTimestamp(),
    }, { merge: true });

    if (stockTotal > 0) {
      transaction.update(rewardRef, {
        stockRemaining: nextStock,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.email || currentUser.displayName || 'resident',
      });
    }

    return {
      redemptionId: redemptionRef.id,
      balanceAfter: nextBalance,
      reward: {
        id: rewardId,
        title,
        pointsCost,
        rewardCategory: category,
        stockTotal,
        stockRemaining: nextStock,
        rewardIsActive: reward.rewardIsActive !== false,
      },
    };
  });

  if (state.currentResident) {
    state.currentResident.points = result.balanceAfter;
    state.currentResident.lifetimeRedeemed = Math.max(0, Number(state.currentResident.lifetimeRedeemed || 0)) + Math.max(0, Number(result.reward.pointsCost || 0));
    state.currentResident.wallet = {
      ...(state.currentResident.wallet || {}),
      currentPoints: result.balanceAfter,
      lifetimeRedeemed: Math.max(0, Number(state.currentResident.wallet?.lifetimeRedeemed || state.currentResident.lifetimeRedeemed || 0)),
    };
  }

  return result;
}
