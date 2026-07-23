# EasyTipMe — Project State & Memory

Brand: **EAZY TIP ME** (Stripe) / EasyTipMe · by **Amidify Solutions Inc.**
Global, industry-agnostic digital tipping SaaS. Admin/owner email: amidifysolutions@gmail.com
Last updated: 2026-07 (living document — update as work continues).

> Read this first when resuming work. It captures architecture, pricing, money
> flow, every feature built, all backend endpoints, and the pre-launch checklist.

---

## 1) Stack & deploy

- **Frontend:** static HTML/JS (Firebase compat SDK v10.12.0). Repo: `easytipme-frontend` → **Vercel** (auto-deploy on push to `main`). Live at easytipme.com.
- **Backend:** Node/Express `server.js`. Repo: `easytipme-backend` → **Render** (auto-deploy on push). Base URL `https://easytipme-backend.onrender.com`.
- **Auth/DB:** Firebase (Email/Password Auth + Firestore), project `easy-tip-me`. Backend uses Firebase Admin SDK (`adminAuth`, `adminDb`).
- **Payments:** Stripe Connect (Express, destination charges) + Stripe Billing (subscriptions). **Currently TEST mode** (`STRIPE_IS_LIVE = STRIPE_SECRET_KEY.startsWith('sk_live')`). Backend serves the publishable key via `/stripe-config` to avoid live/test drift.
- **Email:** Brevo transactional (sender `info@easytipme.com`, support `support@easytipme.com`). NOTE: Brevo rejects `name:''` → always `name: name || undefined`.
- **Deploy flow:** edit files on the Mac (`/Users/hassanatwi/easytipme-*`), `git commit` + `git push` → hosts rebuild. Security-sensitive pushes may need user approval.

Key env vars (Render): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `SUPPORT_EMAIL`, `ADMIN_EMAIL`, `APP_URL`, Firebase service-account creds.

---

## 2) Pricing & plans

**Owner-side plans (mutually exclusive — buying one cancels the other two, no double billing):**

| Plan | Price | Unlocks |
|---|---|---|
| **Pro** | $19.99/mo | Owner payouts (admin fee), Analytics, tip distribution |
| **Business** | $49.99/mo | Everything in Pro + up to **10 locations/branches** |
| **Business Pro** | $99.99/mo | Everything in Business + up to **25 locations/branches** |

- Higher plans **include** lower ones (cards show "✓ Included with your … plan").
- Firestore flags on `businesses/{uid}`: `proActive`+`proSubId`, `businessTierActive`+`businessTierSubId`, `businessProActive`+`businessProSubId`.
- Branch caps enforced backend-side: `BRANCH_LIMITS = {business:10, businesspro:25}`, `branchLimitFor(biz)`.

**Worker plan:**
- **Worker Pro** — $4.99/mo. Unlocks "Who Tipped Me?" (name + message per tip), waives the $2 monthly fee, instant payout (when withdrawals go live). Flag: `workerProActive`+`workerProSubId` on every staff record the person has claimed (matched by `claimedUid`).

**Platform commission (Station 1):** `commissionPercent` (default 10, per-shop overridable) **+** `commissionFixed` (default $0.30, only for major currencies USD/CAD/EUR/GBP). Added ON TOP of the tip (customer pays tip + commission). Currently 10% + $0.30.

---

## 3) Money flow (per tip)

Customer pays `total = tip + commission`. Split:

1. **Platform** keeps `commission` (its % + fixed fee).
2. **Worker** receives `tip − ownerShare − monthlyFee` via destination charge (`transfer_data.destination = workerAcct, amount = workerTransfer`). Worker only needs the `transfers` capability (receive-only). No `on_behalf_of` (would require card_payments).
3. **Owner admin fee (Station 2)** — `ownerShare = round(tip × tipSharePercent/100)` if `tipShareEnabled` (Pro-gated). Deducted from worker, then routed to the owner's connected account after the charge via `/settle-owner-fee` (separate transfer, `source_transaction = charge`). For a **branch**, the fee goes to the **head office** (`orgOwnerUid`)'s connected account. If owner has no ready account → held (returns `held:true`).
4. **$2 monthly fee** — volume-based & fair: at most once per 30 days, only after the worker EARNED > $20 in 30 days (this tip included), only deducted from a tip ≥ $3 (waits for a big-enough tip otherwise). **Waived for Worker Pro.** `FEE_CENTS=200, FEE_MIN_EARNED=2000, FEE_MIN_TIP=300`, marked via `staff.lastFeeTakenAt`.

**Hold & release:** if the worker isn't connected yet, the tip is charged with `held:'1'` (platform holds worker's share) and released later via `/staff/release-held` once their `transfers` capability is active. Platform never siphons — only holds for a not-yet-ready worker.

**Defaults are safe:** when the admin fee is OFF (the norm, and forced off when not Pro), `ownerShare=0` and nothing about the base flow changes.

---

## 4) Features built

**Owner dashboard (`dashboard.html`)** — nav order: Team management · Company profile · Analytics · Branches · Settings · ⭐ Subscription. Sidebar badge shows current plan (Free plan / Pro / Business / Business Pro), auto-set from flags.
- **Subscription tab:** the ONE place with pricing — 3 plan cards stacked (Pro/Business/Business Pro) with upgrade/active(+cancel)/included states.
- **Analytics tab:** own tab, locked behind any plan (shows "See subscription plans" when locked). "Your share" = sum of ownerShare.
- **Settings:** admin fee + Get paid are Pro-gated (PRO badge, "See subscription plans" when locked; cancelling Pro auto-switches the admin fee off). Save button small, right-aligned inside the admin-fee card. **Delete my account** = small link → 6-digit email code confirm.
- **Get paid (Pro):** owner connects bank (Stripe Connect). Payout country auto-inferred from saved country → unambiguous currency → browser region; **no blanket Canada default** (ambiguous like EUR → user picks). Shows balance + recent payouts.
- **Cancel Pro** in the plan card. **Business plan cancel** in its card.

**Branches (Business tier) — `dashboard.html` Branches tab + backend:**
- List with used/limit ("2 / 10"), combined totals; **+ Add branch** (disabled at limit, prompts to upgrade). Each branch = its own `businesses/{branchId}` doc with `orgOwnerUid`, `isBranch:true`, own `shopCode`, staff, tips. Customer/worker flows work unchanged (public reads) — **no Firestore rules change needed**; all branch management via Admin SDK.
- **Manage** button per location (main + branches) → modal: edit location settings (name/currency/tip presets), full team CRUD (add/edit/remove/restore), and **Move staff between locations** (per-row "Move to…" picker → `/branch/staff/move`). Adding a member with an email sends the standard invite.

**Worker app (`staff.html`)** — bottom nav: Home · Insights · Settings.
- **Worker Pro card** (Settings) with upgrade/active(+cancel), price, and privacy note "🔒 Who Tipped Me? is private to you — your workplace can't see it."
- **Who Tipped Me?:** Pro workers see customer **name + message** per tip; free workers see a 🔒 marker only. Owner never sees who tipped (aggregates only) — privacy enforced at UI level (see pre-launch note for true field separation).

**Customer tip page (`shop.html`):** optional name + **optional short message** (stored as `message` on the tip). Server-authoritative breakdown. Triggers `/settle-owner-fee` after success when there's an admin fee.

**Worker shifts (schedule) — BUILT:** each staff record can have `days` (["Mon"..]), `shift1{s,e}`, `shift2{s,e}` (HH:MM 24h). Set in the owner's staff forms (main team form + branch-manager form both have days/shift inputs). The customer tip page (`shop.html`, `onShiftNow()`) shows ONLY workers on shift **right now**, judged by the **customer's own device clock** — the customer is physically at the shop, so their local time == the shop's local time, so NO timezone storage/conversion is needed. No schedule set → always shown. Supports overnight windows (end ≤ start wraps past midnight).

**Tip pooling (equal split) — BUILT, FREE, owner-controlled:** business flag `tipPoolEnabled` (Settings → "Tip pooling" toggle). When ON, every tip is split **equally among the on-shift team** at that location. Compliant split-at-source: `create-payment-intent` takes a plain charge (metadata `pool:'1'`, `poolStaffIds`); after the charge succeeds `shop.html` calls **`/settle-pool`**, which splits the worker portion (tip − ownerShare) equally via Stripe transfers on the SAME charge (idempotency `pool_<paymentId>_<staffId>`) to on-shift **payout-ready** workers, and routes the owner admin fee too. On-shift-but-not-ready workers are skipped this round (connect bank to receive). The pooled tip is recorded as `multiple:true, pooled:true` with recipientIds = the on-shift set, so it appears in every pooled worker's app (each sees their equal share). This is the owner-policy equal-split — distinct from the deferred worker-to-worker tip-out below.

**Admin panel (`master.html`):** admin = `amidifysolutions@gmail.com`. Lists all businesses, per-shop commission (% + fixed) override, resilient loads. 6-digit code password reset.

**Other:** 6-digit code "forgot password" on all 3 logins (admin/business/worker). Full contact form (`contact.html` → `/contact` → support inbox). Large-tip admin alert (≥ $30 → ADMIN_EMAIL).

---

## 5) Backend endpoints (`easytipme-backend/server.js`)

- `POST /create-payment-intent` — the split engine (commission, owner fee, monthly fee, hold/ready).
- `GET /stripe-config` — publishable key.
- Billing: `POST /billing/create-checkout` (plans: owner/worker/business/businesspro), `/billing/confirm` (mutually-exclusive owner plans; worker tags all claimed staff), `/billing/cancel`.
- Account: `POST /business/delete-request` (emails 6-digit code), `/business/delete` (requires code; deletes shop + branches + subs + auth user).
- Branches: `POST /branch/create`, `/branch/list` (returns limit+used), `/branch/rename`, `/branch/delete`, `/branch/settings`, `/branch/team`, `/branch/staff/save`, `/branch/staff/remove`, `/branch/staff/move`. Helper `ownsLocation(uid,id)`.
- Tips/settle: `POST /settle-owner-fee` (Station 2 transfer, idempotent), `/staff/release-held`, `/notify-tip`.
- Staff: `POST /staff/invite` (branch-aware via ownsLocation), `/staff/activate`, `/staff/delete`, `/staff/change-email`.
- Owner payout: `POST /connect/create-owner-account`, `/connect/onboarding-link`, `/connect/status`, `/connect/balance`, `/connect/create-account` (worker).
- Reset: `POST /reset-request`, `/reset-confirm` (+ `/send-code`, `/verify-code`, `/send-verification`).
- `POST /contact`, `/owner/change-email`.

---

## 6) Firestore data model (high level)

- `businesses/{uid}` — a shop OR (with `orgOwnerUid`, `isBranch:true`) a branch. Fields: businessName, currency, country, logo, shopCode, commissionPercent/Fixed, tipShareEnabled/tipSharePercent, notifyEmail, plan flags, ownerConnectAccountId, orgOwnerUid.
  - `staff/{id}` — nickname, realName, email, phone, job, photo, days, shift1/2, published, status, claimedUid, connectAccountId, workerProActive, lastFeeTakenAt.
  - `tips/{id}` — tip, fee, total, currency, rating, fromName, message, ownerShare, staffShare, paymentId, held, released, staffId, recipientEmails[].
  - `consents/{id}` — tip-sharing agreements.
- `shopCodes/{CODE}` → `{bid}` (short workplace code → business/branch id).
- `config/platform` (commission defaults), `config/billing` (lazily-created Stripe price ids per test/live).
- `resetCodes/{uid}`, `deleteCodes/{uid}` — 6-digit OTPs.

**Firestore rules (`firestore.rules`):** `isAdmin()` = admin email. Public `get` on businesses/staff/shopCodes; tips create allowed unless blocked; owner + admin (+ recipient by email) can read tips/consents. Branch management does NOT rely on client rules (Admin SDK).

---

## 7) Pre-launch checklist (IMPORTANT before going live)

- [ ] Flip Stripe to **LIVE** keys on Render (`STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY`).
- [ ] **Rotate** the Firebase service-account key; enable 2FA on the admin Gmail.
- [ ] **Separate private staff fields** (real name, email, phone) and **tip fromName/message** into a private sub-doc so the owner cannot read "who tipped" at the data level (currently UI-enforced only).
- [ ] Subscription cancellation via **Stripe webhook** (currently immediate `subscriptions.cancel`).
- [ ] Settle **held owner fees** when the owner connects their bank later (parallel to `/staff/release-held`).
- [ ] Confirm `source_transaction` owner-fee transfer behaves on destination charges in LIVE; else move to separate charges & transfers.
- [ ] Worker email currently shows the gross tip; consider showing net after fees.

---

## 8) Pending / possible next work

- **Instant payout** for workers (Pro) — withdrawal flow is "Coming soon"; when built, Pro gets instant at a reduced fee (~1–2%, not 5%).
- **Worker→worker "tip-out" (Pro) — SPLIT AT SOURCE, never a balance transfer.** Idea: a Pro worker pre-sets rules to share a % of each tip with same-branch colleagues (e.g. 10% to the busser, 5% to kitchen). The split happens AT PAYMENT TIME via Stripe multi-transfers on the original charge (same `source_transaction` pattern already used for the owner fee / Station 2) — money is divided from the incoming payment and NEVER moves between workers' settled accounts.
  - **Compliance rationale (important):** letting a worker send already-received money to another worker — even "only inside our platform" — makes us a *money transmitter / MSB* requiring licensing (FINTRAC in Canada, FinCEN in the US). That's exactly what Venmo/PayPal/Cash App are licensed for. So we deliberately do NOT build "balance transfer"; split-at-source gives the same practical result (colleague sharing) with no licensing burden. (Not legal advice — confirm with a compliance advisor / Stripe before shipping.)
  - **Design:** worker-app Settings → "Share my tips (tip-out)", Pro-gated; pick same-branch colleague + %, cap total ≈50%. Data: `tipOut: [{toStaffId, percent}]` on the worker's staff doc. Computed in `create-payment-intent`. Colleague not payout-ready → their share is *held* like existing held tips. Customer tip page stays clean — no split shown to the tipper.
  - **STATUS:** designed, but may intentionally SKIP to avoid over-complicating the system. Decide later.
- **Tip pooling / distribution** UI (Business) — split a tip across a team by rule.
- Per-currency flat fees (beyond USD/CAD/EUR/GBP).
- NFC "Tap to Tip", POS integration (later expansion).

---

*Competitor research + profit calculator exist in `docs/` and were used to set pricing (market ≈ 5% + small fixed; SaaS subscription is the biggest steady-revenue lever — hence the plan tiers).*
