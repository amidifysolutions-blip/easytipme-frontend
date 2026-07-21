# EasyTipMe — كيف بتشتغل منصّات البقشيش الحقيقية (بحث بمصادر)
### مرجع لاتخاذ قرار نموذج الدفع والربح

> **الخلاصة:** حدسك صح. الفلوس بتنزل بحساب العامل مباشرة، إنت ما بتمسك شي، وبتربح من **٣ مصادر** بدون ما تمسك أموال حدا. هيدا نموذج أنظف منصّات البقشيش على Stripe.

---

## 1) شو بيعملوا المنافسين؟

| المنصّة | بتمسك الفلوس؟ | كيف بتربح | سحب فوري؟ |
|---|---|---|---|
| **TipDrop** | ❌ مباشرة (Stripe) | رسم صغير على التيب + ~$2/شهر | ✅ Stripe Instant |
| **Uptip** | ❌ حساب Stripe تبع العامل | رسم (غير معلن) | غير مؤكّد |
| **QuickTip** | ❌ مباشرة (Stripe) | رسم صغير على التيب | لأ (١-٢ يوم) |
| **Tiptop Jar** | ❌ PayPal تبع العامل | تفعيل + اشتراك | مدفوع بالخطط الأعلى |
| **TipHaus** | ❌ "بدون حسابات تجميع" | اشتراك + رسم صغير لكل تحويل | يوم-التالي أو فوري بمحفظتهم |
| **Tippy** | ❌ محفظة Branch | اشتراك (~$300/سنة) | ✅ عبر Branch |
| **Grazzy** | ❌ لحساب العامل | رسوم معالجة + اشتراك من $100/شهر | ✅ مربوط برسم |
| **TackPay** | ⚠️ محفظة داخلية | ٥٪ + £0.30/تيب + اشتراكات | لأ (أيام للبنك) |
| **Kickfin** | ⚠️ حساب مموّل مسبقًا | ~$75-100/موقع/شهر + رسم | ✅ (هو المنتج) |

**الأنماط:** الدفع المباشر للعامل هو السائد. الربح = نسبة على كل تيب + اشتراك SaaS (غالبًا الزبون بيتحمّل رسم التيب). السحب الفوري = ميزة مدفوعة (DoorDash $1.99 · Uber ~$0.85 لكل تحويل فوري).

---

## 2) الآلية التقنية بـ Stripe

**أ) Direct charges** — الفلوس بتنزل بحساب العامل، إنت ما بتلمسها. عمولتك بتاخدها بنفس اللحظة عبر `application_fee_amount` اللي بتروح لحسابك. Stripe (مش إنت) بيمسك ويحرّك. ✅

**ب) Instant Payouts** — فيك تربح منه بدون إمساك: بتحدّد سعرك، Stripe بتجمعه كرسم لحظة التحويل. **Stripe بتاخد ١٪ منك، وإنت بتحطّ فوقها هامشك وبتربح الفرق.** ✅

**ج) السحب المجدول العادي (يومي/أسبوعي/شهري)** = مجاني على Stripe. فما فينا نقتطع نسبة عليه إلا لو مسكنا الفلوس (مرفوض). لهيك التيرات الوسط انلغت.

**د) قانونيًا:** نموذج Stripe المباشر بيقلّل عبء تراخيص تحويل الأموال — بس حسب البلد، ويستحسن مراجعة قانونية بكل سوق.

---

## 3) النموذج المعتمد لـ EasyTipMe

**٣ مصادر ربح بدون إمساك فلوس:**
1. عمولة نسبة على كل بقشيش (`application_fee`) — دخلك الأساسي.
2. **٥٪ على السحب الفوري** (Stripe ١٪ + هامشك).
3. اشتراك Pro (تحليلات، تقارير، مزايا).

**السحب:** مجدول مجاني + فوري ٥٪.

---

## المصادر (URLs)

**منصّات:** tackpay.net/En/pricing.html · easytip.net/knowledge-center/cost-my-business · tiptopjar.com/faq · kickfin.com (pricing) · tiphaus.com/eta · Tippy+Branch (prnewswire) · techcrunch.com/2023/01/20/grazzy-digital-tipping · tipdrop.org · quick-tip.com · uptip.co/faq
**Stripe:** docs.stripe.com/connect/charges · /direct-charges · /destination-charges · /marketplace/tasks/app-fees · /instant-payouts · /platform-pricing-tools · stripe.com/connect/pricing · /manage-payout-schedule
**تطبيقات الشغل:** DoorDash Fast Pay ($1.99): help.doordash.com · Uber Instant Pay: uber.com/us/en/drive/driver-app/instant-pay

---

*EasyTipMe · Amidify Solutions Inc. — مرجع حيّ.*
