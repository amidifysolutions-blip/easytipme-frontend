# EasyTipMe — Session Changelog (July 2026)

Record of what was built/fixed in this working session. Newest first.

## Payments: the money engine (Option A — direct, no holding)

**Customer payment fixed (was fully broken).** The tip page showed
"elements should have a mounted Payment Element." Root cause: the customer page
used the **live** publishable key while the backend created the PaymentIntent in
**test** mode — a key/mode mismatch. Fixed permanently by making the **backend
the single source of truth** for the publishable key:
- Backend reads `STRIPE_PUBLISHABLE_KEY` (Render env) and returns it with every
  PaymentIntent + a `GET /stripe-config` endpoint.
- `shop.html` uses the backend-provided key (hardcoded live key is fallback only).
- At launch: flip `STRIPE_SECRET_KEY` **and** `STRIPE_PUBLISHABLE_KEY` to live on
  Render together — the page follows automatically. Mismatch is now impossible.

**Direct-to-worker split (`/create-payment-intent`).** For a single recipient:
- Commission (Station 1) is a % **added on top** of the tip.
  Priority: per-shop rate → global default (`config/platform`) → **7%** fallback.
- If the worker's Connect account is ready (`charges_enabled`): a **destination
  charge** sends the tip straight to the worker, the commission to the platform
  (`application_fee_amount`), and `on_behalf_of: worker` makes the **worker bear
  Stripe's processing fee** (per decision). Platform commission = clean profit.
- Worker's Connect account id is looked up **server-side** (never trusted from
  the browser).

**Hold-and-release (Option B for not-ready workers).** If the worker hasn't
finished connecting their bank, the tip is still accepted; the platform holds the
worker's share (recorded `held:true, released:false, staffId`) and keeps its
commission. The worker still appears on the tip page.
- `/staff/release-held` (called by the worker's app once their account is ready)
  transfers every held+unreleased tip to them, idempotently (`release_<tipId>`),
  and marks it released.

## Per-shop commission
- Admin master: **Edit business** now has "Platform commission % for this shop"
  (blank = use default). Stored as `businesses/{id}.commissionPercent`.
- Global default raised from 5% to **7%**.

## Notifications
- **Fixed:** `/notify-tip` still had the Brevo empty-name bug
  (`name: r.name || ''` → rejected). Now `name || undefined` everywhere.
- **New:** admin email alert when a tip total ≥ `ADMIN_TIP_ALERT` (default **30**),
  sent to `ADMIN_EMAIL` (default amidifysolutions@gmail.com).
- Audited every email send (notify-tip, notify-welcome, staff/invite, send-code,
  send-reset, owner/change-email, admin alert): all `to:` fields safe.

## Connect onboarding
- Prefill business website (`business_profile.url = easytipme.com`) for both
  worker and owner accounts so the field is no longer blank / asked for.

## Known interim gaps (next up)
1. **Station 2 (owner's tip-share)** transfer to the owner is not wired yet
   (needs a webhook or a settle step). Common case (tip-share off) unaffected.
2. **Held tips** settle on the platform, so the platform bears Stripe's fee on
   those specific (temporary) tips until released.
3. **Team tips** (one payment split across several workers) still use the plain
   platform charge — per-worker split is a later phase.
4. Release is triggered from the worker's app; a Stripe `account.updated` webhook
   would make it fully automatic.

## Pre-launch security reminders
- Rotate the Firebase service-account key.
- Set `STRIPE_PUBLISHABLE_KEY` (+ secret) to live values at launch.
- Consider 2FA on the admin Gmail.

---

## Update — monetization refinements

**Clean worker transfer.** The direct charge now uses `transfer_data.amount = tip`
so the worker's Stripe account shows exactly the tip (e.g. $50), not the gross
"$53.50 minus a fee". Net result unchanged (worker = tip, platform = commission
minus Stripe fee).

**Commission = percentage + fixed fee.** Now `X% + $Y` (default **7% + $0.30**),
both added on top of the tip. The fixed part covers Stripe's fixed ~$0.30 cost so
small tips stay profitable (industry standard, cf. TackPay "5% + £0.25").
Configurable globally (`config/platform.commissionPercent` / `commissionFixed`)
and per-shop (`businesses/{id}.commissionPercent` / `commissionFixed`) in master.

**Monthly $2 active-account fee.** Taken from the worker's tip, at most once per
30 days, only when the worker has **more than 5 tips in the last 30 days** and
only from a tip **>= $3** (so they still net from it; if the 6th tip is too
small we wait for the next tip >= $3 in the cycle). Marked via
`staff.lastFeeTakenAt`. The customer's total is unchanged. (Model: TipDrop.)

**Decided for Pro (not built yet):** tip sharing / pooling is a Pro feature — the
strongest owner subscription anchor (cf. TiPJAR's tip-distribution tier at the
top of their pricing).
