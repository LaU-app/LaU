# Devpost submission text (copy and paste)

## Project name
LaU Marketplace: verified campus commerce with PayPal + AI-powered search

## Elevator pitch (200 characters max)
A student social network where verified local businesses sell with PayPal, and AI search turns "a calculator for Calculus, max $25" into the right verified product, with evidence.

## Inspiration
LaU is a social network built by students for university students in El Salvador. It brings a feed, study tools and a marketplace together in one app. Students constantly need study supplies, and local businesses want to sell to them. But campus commerce runs on informal channels: no way to know who to trust, cash on delivery, and no simple way for a small business to get paid online. We wanted trust and payments built into the place students already spend their day.

## What it does
- **Verified merchants.**
  - A business applies in the app with its legal data: legal name, NIT, NRC and a supporting document.
  - The LaU team approves it in our admin panel, requests changes or suspends it. Approval sends an email from LaU.
  - The merchant connects PayPal through **Partner Referrals**.
  - LaU checks the seller status with PayPal: can receive payments, email confirmed, permissions granted. Only then does the store get the *"Verified by LaU · PayPal"* badge.
- **AI-powered search.**
  - In the Marketplace search box, a student describes a need in plain Spanish, optionally with a budget. A *Smart search* section appears above the normal results.
  - **Jev (TypeSafe AI)** evaluates only real products from verified merchants. For each pick it quotes the sentence from the real product description that best shows the fit; the sentence is selected, never generated.
  - The pick also shows reasons computed in code (rank, budget, stock), product facts, and YouTube reviews that Jev confirmed are about that kind of product. If there are none, it says so.
  - It asks for details when the request is too vague and never pays on its own.
- **PayPal checkout.**
  - The backend computes the price and creates an **Orders v2** order with the merchant as payee.
  - The student confirms the summary and approves in the **PayPal JS SDK** popup.
  - The backend verifies the order with PayPal and captures it. Only a `COMPLETED` capture creates a paid order.
- **After the sale.** Buyer and seller see the order as *Paid*. The buyer can message the seller with a rich preview of the product.

## How we built it
- **Frontend:** Vue 3 + Ionic 8 (web on Firebase Hosting, Android via Capacitor) and the PayPal JavaScript SDK.
- **Backend:** Laravel 12 with Sanctum.
  - PayPal is called from Laravel's HTTP client: OAuth, Partner Referrals, Merchant Integrations and Orders v2, with idempotency keys and strict validation.
  - Jev is called the same way at `POST /v1/systemone` with typed questions: noul, choice and score.
- **AI design.** Following TypeSafe's guidance, *the AI makes judgments and our code makes decisions*.
  - Jev answers small questions: purchase intent, whether an item or a purpose is named, category, the meaning of each amount, per-candidate match, fit and relevance, which description sentence is the best evidence, and whether each YouTube video is about the product.
  - A decision table in code decides whether to recommend, ask the student to confirm, or ask for details.
  - Budget comparisons and totals are always done in code.
  - Every decision is stored with its probabilities for auditing.
- **Admin:** a Laravel Blade panel for merchant review and the AI decision log.
- **Tests:** PayPal and TypeSafe are mocked with `Http::fake`, plus an optional live test against Jev. The frontend has Vitest unit tests for the payment sheet and the smart search.

## Challenges we ran into
- Keeping PayPal as the source of truth. Seller status is checked before quoting, creating and capturing. The capture is validated against the payee, amount, currency and buyer.
- Making the AI useful without letting it touch money. Designing small, typed questions and a conservative decision table took several iterations.
- Building for a Spanish-speaking audience while keeping everything auditable for an international jury.

## Accomplishments that we're proud of
- A complete, real flow, from a business applying to a student paying a verified merchant in PayPal Sandbox, inside an app students already use.
- An AI search that is transparent: it shows how well each real product matches and quotes the real evidence. It never invents inventory or reviews, and it always asks the student to confirm.

## What we learned
- How PayPal's multiparty pieces fit together: Partner Referrals, Merchant Integrations and Orders with a payee.
- Typed decision models are a great fit for commerce: calibrated probabilities make thresholds and audits easy.

## What's next for LaU Marketplace
- Refunds and disputes from the merchant panel, and webhooks for onboarding and consent changes.
- Multi-item carts paid with PayPal.
- Going live in El Salvador after the pilot.

## Built with
`vue` · `ionic` · `capacitor` · `laravel` · `php` · `mysql` · `paypal-orders-api` · `paypal-partner-referrals` · `paypal-js-sdk` · `typesafe-ai` · `jev` · `firebase-hosting`

## Testing instructions (private field)
- App: https://lauapp.es (UI in Spanish; a glossary is in `HACKATHON.md`)
- LaU student: `estudiante.demo@lauapp.es` / `<PASSWORD>`
- LaU merchant: `comercio.demo@lauapp.es` / `<PASSWORD>`
- PayPal Sandbox buyer: `sb-g9x2153766254@personal.example.com` / `<PASSWORD>`
- Step-by-step guide with two browsers: `HACKATHON.md` → "How to test".
- This is a pre-launch testing environment: all payments use PayPal Sandbox, so no real money moves.
