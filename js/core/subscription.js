/**
 * Subscription layer — plan, status and billing math. Kept separate from BOTH
 * auth (who you are) and payment (how you pay) so each can evolve independently.
 *
 * Pricing: 10 € / month / seat. `seats` is 1 in this version but the model and
 * price math already support teams (multiple users per account).
 */
import { auth } from "./auth.js";

export const PRICE_PER_SEAT = 10;
export const CURRENCY = "EUR";

export const PLAN = { FREE: "FREE", PREMIUM: "PREMIUM" };
export const STATUS = { FREE: "FREE", ACTIVE: "ACTIVE", CANCELLED: "CANCELLED", EXPIRED: "EXPIRED" };

export const subscription = {
  /** Is this user entitled to premium right now? (ACTIVE, or CANCELLED but still within the paid period). */
  isPremium(user = auth.currentUser()) {
    if (!user || user.subscriptionPlan !== PLAN.PREMIUM) return false;
    if (user.subscriptionStatus === STATUS.EXPIRED) return false;
    if (user.subscriptionRenewalDate && new Date(user.subscriptionRenewalDate) < new Date()) return false;
    return user.subscriptionStatus === STATUS.ACTIVE || user.subscriptionStatus === STATUS.CANCELLED;
  },

  priceFor(seats = 1) { return seats * PRICE_PER_SEAT; },

  /** Snapshot for the account page. */
  summary(user = auth.currentUser()) {
    const premium = this.isPremium(user);
    return {
      plan: user?.subscriptionPlan || PLAN.FREE,
      status: user?.subscriptionStatus || STATUS.FREE,
      premium,
      seats: user?.seats || 1,
      price: this.priceFor(user?.seats || 1),
      startDate: user?.subscriptionStartDate || null,
      renewalDate: user?.subscriptionRenewalDate || null,
      createdAt: user?.createdAt || null,
    };
  },

  /** Mark the account premium after a successful payment. */
  activate({ seats = 1 } = {}) {
    const start = new Date();
    const renewal = new Date(start);
    renewal.setMonth(renewal.getMonth() + 1);
    return auth.updateCurrentUser({
      subscriptionPlan: PLAN.PREMIUM,
      subscriptionStatus: STATUS.ACTIVE,
      subscriptionStartDate: start.toISOString(),
      subscriptionRenewalDate: renewal.toISOString(),
      seats,
    });
  },

  /** Cancel auto-renewal but keep access until the period ends. */
  cancel() { return auth.updateCurrentUser({ subscriptionStatus: STATUS.CANCELLED }); },

  /** Re-enable auto-renewal on a cancelled-but-still-active subscription. */
  resume() { return auth.updateCurrentUser({ subscriptionStatus: STATUS.ACTIVE }); },
};
