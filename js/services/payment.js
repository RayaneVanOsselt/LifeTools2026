/**
 * Payment layer — a provider-agnostic checkout interface.
 *
 * The rest of the app only ever calls `paymentProvider.checkout(order)` and
 * awaits `{ success, transactionId }`. Today that's a MOCK that simulates
 * processing latency and always succeeds. To go live, implement a real provider
 * (Stripe, Mollie, Adyen…) with the SAME `checkout` signature and export it as
 * `paymentProvider` — nothing else in the app changes.
 *
 * A real provider would additionally emit webhook-driven events (renewal,
 * payment_failed, cancelled, invoice.created) that update `subscription.js`.
 */

/** @typedef {{ plan: string, seats: number, amount: number, currency: string, user?: object }} Order */

export class PaymentProvider {
  /** @param {Order} order @returns {Promise<{success:boolean, transactionId?:string, error?:string}>} */
  async checkout(order) { throw new Error("checkout() not implemented"); }
  get name() { return "abstract"; }
}

/** Fake provider for the prototype — no real transaction happens. */
export class MockPaymentProvider extends PaymentProvider {
  async checkout(order) {
    // Simulate a payment gateway round-trip.
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, transactionId: `demo_${Date.now().toString(36)}`, provider: "mock" };
  }
  get name() { return "mock"; }
}

/*
 * Example of the future swap (kept as documentation, not executed):
 *
 *   export class StripeProvider extends PaymentProvider {
 *     async checkout(order) {
 *       const res = await fetch("/api/checkout", { method: "POST", body: JSON.stringify(order) });
 *       const { url } = await res.json();      // Stripe Checkout Session URL
 *       location.assign(url);                  // redirect to hosted, PCI-compliant page
 *     }
 *   }
 *   export const paymentProvider = new StripeProvider();
 */

// ── Swap this single line to go live. ──────────────────────────────
export const paymentProvider = new MockPaymentProvider();
