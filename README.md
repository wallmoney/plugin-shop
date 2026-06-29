# Wall Money Shop Plugin

Wall Money Shop is a marketplace plugin for running a lightweight ecommerce storefront without a server database.

The plugin keeps the cart, delivery draft, saved delivery details, and merchant configuration in portal plugin storage. Product listings are designed to be published as immutable IPFS JSON objects and referenced from a mutable catalog CID/IPNS name through a gateway such as `https://ipf.sk`.

## Plugin Metadata

- Plugin ID: `wallmoney/wmshop`
- Marketplace source: `wallmoney/plugin-shop`
- Version: `0.1.0`
- Entry: `default`
- Icon: `icon.svg`

## User Flow

1. Browse the product overview with category filters and search.
2. Add products to a local cart.
3. Review quantities and subtotal.
4. Enter delivery details during checkout.
5. Optionally save delivery details locally for future orders.
6. Pay through the Wall Money prefilled payment flow.
7. Return to the plugin and see the order marked as paid after the portal payment event.

Dedicated cart link:

```text
/marketplace/wallmoney/plugin-shop?view=cart
```

## Source Layout

Edit the SvelteKit preview in `app/` and the portal plugin runtime in `src/`. Releases build the compiled `dist/plugin.js` bundle and publish it to npm; the marketplace loads that bundle through jsDelivr.

```text
app/routes/+page.svelte      SvelteKit shop preview UI
migrations/catalog/*.sql    Cloudflare D1 catalog schema migrations
migrations/orders/*.sql     Optional Cloudflare D1 order collection schema migrations
seeds/catalog/products.sql  Optional demo D1 catalog rows
scripts/build-catalog.mjs   Optionally regenerates src/inventory.ts when data/catalog.json exists
scripts/build-plugin.mjs    Compiles ordered plugin source into dist/plugin.js
workers/catalog-d1.ts       Optional D1-backed catalog JSON Worker
workers/order-fulfillment.ts      Optional payment-verified fulfillment Worker
workers/order-stock.ts      Optional external stock-decrement webhook using Cloudflare KV
workers/wrangler.catalog-d1.jsonc Example Cloudflare Worker D1 catalog config
workers/wrangler.order-fulfillment.jsonc Example Cloudflare fulfillment Worker config
workers/wrangler.order-fulfillment.d1.jsonc Example fulfillment Worker config with D1 order collection
workers/wrangler.order-stock.jsonc Example Cloudflare Worker KV stock config
src/config.ts               Shop defaults
src/inventory.ts            Generated categories and products
src/state.ts        Local plugin state normalization and storage actions
src/catalog.ts      Category/product filtering and IPFS gateway URL helpers
src/cart.ts         Cart totals, quantity actions, order references
src/ui/products.ts  Shop-style category grid and product detail UI
src/ui/cart.ts      Shopping cart view
src/ui/checkout.ts  Delivery details and Wall Money payment action
src/ui/orders.ts    Local order result view
src/email.ts        Admin order fulfillment composition
src/stock.ts        Optional post-payment stock decrement webhook payload
src/plugin.ts       Portal runtime entrypoint
dist/plugin.js      Generated npm/jsDelivr bundle, not committed
build/              Generated static SvelteKit preview, not committed
```

## Build Outputs

The portal plugin sandbox cannot execute a SvelteKit app directly. This repo therefore builds two useful outputs locally and in CI:

- `dist/plugin.js` — marketplace-ready plugin bundle consumed by `package.json` via `"bundle"` and published to npm.
- `build/` — static SvelteKit preview for local design/development.

GitHub keeps the metadata and source. npm keeps the compiled bundle. The marketplace reads `package.json` from GitHub, resolves the latest npm release, then loads `dist/plugin.js` from jsDelivr.

Build the npm plugin bundle:

```sh
npm run build
```

Build only the marketplace bundle:

```sh
npm run build:plugin
```

Build only the SvelteKit static preview:

```sh
npm run build:web
```

## Configurable Catalog

The active catalog is configured in `src/config.ts`. This shop currently loads an immutable IPFS catalog:

```js
defaultCatalogProvider: 'remote',
defaultCatalogRef: 'ipfs://bafkreihynddvac67beq63ecj2roefutctrjsyiitjrzlczhyh2amahm4va'
```

The catalog JSON uses this shape:

```json
{
  "version": 1,
  "categories": [
    { "id": "tea", "label": "Tea", "helper": "Leafy rituals and warm cups", "order": 1 },
    { "id": "coffee", "label": "Coffee", "helper": "Roasted daily essentials", "order": 2 }
  ],
  "products": [
    {
      "id": "red-tea",
      "name": "Red Tea",
      "category": "tea",
      "price": 12,
      "cid": "bafybeiev3uiuiwi26zchkmxqpepoaz5rieiivq6yk4tcutjbsixtozriya",
      "description": "A mellow red tea with a ruby cup, gentle tannins, and a naturally sweet finish.",
      "vendor": "Wall Money Pantry",
      "badge": "Popular",
      "packLabel": "80g pouch",
      "digital": false
    }
  ]
}
```

If you temporarily add `data/catalog.json` for local editing, regenerate the bundled fallback source:

```sh
npm run build:catalog
```

The plugin UI is rendered by the portal’s schema renderer. The shop uses richer shop-specific schema nodes for a light/dark product-grid experience, category rail, product detail page, themed cart, checkout form, and CoreID identicon that navigates back to the bank portal.

## Shop Settings

Shop-level settings live in `src/config.ts`. Currency and minimum checkout amount are configured per shop, not per item:

```js
defaultCatalogProvider: 'remote',
defaultCatalogRef: 'ipfs://bafkreihynddvac67beq63ecj2roefutctrjsyiitjrzlczhyh2amahm4va',
catalogD1: {
  apiUrl: 'https://catalog.example.com/catalog'
},
defaultCurrency: 'USD',
minimumCheckoutAmount: 50,
deliveryFee: 0
```

`defaultCatalogProvider` selects where categories and products are loaded from:

| Value | Source | Related Config |
| --- | --- | --- |
| `local` | Bundled `src/inventory.ts` fallback catalog | `defaultCatalogProvider: 'local'` |
| `remote` | IPFS/IPNS/HTTPS JSON catalog through the portal `network.getJson` API | `defaultCatalogRef` and the built-in `https://ipf.sk` gateway |
| `d1` | Cloudflare D1 catalog Worker returning the same JSON shape | `catalogD1.apiUrl` |

If `minimumCheckoutAmount` is missing, `0`, or not a valid positive number, checkout has no minimum amount.
`deliveryFee` is applied once per order when the cart contains at least one physical item. Products marked with `"digital": true` do not require delivery; carts containing only digital items skip the delivery fee.

## Order Fulfillment Webhook

The portal does not store shop email credentials, fulfillment webhook signing secrets, or stock API credentials. After a successful payment, the plugin posts the order payload to the plugin-owned fulfillment Worker configured in `src/config.ts`. The Worker decides whether to send an admin email, send a signed webhook, or do both.

If no order collection route is configured, checkout is blocked with:

```text
No order collection is configured, please contact admin.
```

```js
orderEmail: {
  provider: 'webhook',
  adminEmail: 'admin@example.com',
  webhookUrl: 'https://order-fulfillment.example.com/orders/paid'
},
orderFulfillment: {
  mode: 'email', // "email", "webhook", "both", "storage", or "none"
  webhookUrl: 'https://order-fulfillment.example.com/orders/paid'
},
orderPayment: {
  webhookUrl: 'https://order-fulfillment.example.com/orders/payment-webhook'
}
```

Development mode is disabled by default and should normally be omitted from `src/config.ts`. For local testing only, it can be enabled with any of these values:

```js
DEV_MODE: true
DEV_MODE: 1
DEV_MODE: 'true'
DEV_MODE: '1'
```

When `DEV_MODE` is enabled, checkout cannot finish orders and shows:

```text
Dev mode is enabled, disable it for production.
```

Production mode requires plugin-owned Worker/API endpoints to be valid `https://` URLs. They do not need to be on `wall.money`; merchants should use their own origins for fulfillment, stock, and D1 catalog APIs. The `example.com` URLs in this README are placeholders and must be replaced before production use.

Plugin-side fulfillment config:

| Name | Location | Required | Description |
| --- | --- | --- | --- |
| `DEV_MODE` | `src/config.ts` | No | Omit for production. `true`, `1`, `'true'`, or `'1'` enables local development mode, blocks checkout completion, and allows non-HTTPS local Worker/API URLs. |
| `orderEmail.provider` | `src/config.ts` | Yes | Use `webhook` for the fulfillment Worker. `mailto` is only a local fallback. `none` disables order collection. |
| `orderEmail.adminEmail` | `src/config.ts` | Required for `email` and `both` modes | Admin recipient. This is not secret. |
| `orderEmail.sendCustomerReceipt` | `src/config.ts` | No | Whether the fulfillment Worker receives a customer receipt email payload when the customer email is available. |
| `orderEmail.webhookUrl` | `src/config.ts` | Required unless `orderFulfillment.webhookUrl` is set | Backward-compatible fulfillment Worker URL. |
| `orderEmail.fromName` | `src/config.ts` | No | Display name used by email templates. |
| `orderEmail.subjectPrefix` | `src/config.ts` | No | Prefix for admin email subjects. |
| `orderFulfillment.mode` | `src/config.ts` | Yes | `email`, `webhook`, `both`, `storage`, or `none`. Use `storage` when the fulfillment Worker only collects the order, for example in D1. |
| `orderFulfillment.webhookUrl` | `src/config.ts` | Required for `email`, `webhook`, `both`, and `storage` | Endpoint of the plugin-owned fulfillment Worker. This is not the downstream merchant webhook. |
| `orderPayment.webhookUrl` | `src/config.ts` | Recommended | Endpoint passed to Wall Money/coreapi as the transfer `wh` callback. When set, checkout prepares an order draft in the Worker before opening payment. |

Use `workers/order-fulfillment.ts` as an example standalone fulfillment Worker. Configure the email provider and optional outgoing fulfillment webhook in the Worker environment:

```text
FULFILLMENT_MODE=both
FULFILLMENT_WEBHOOK_URL=https://fulfillment.example.com/orders/paid
EMAIL_PROVIDER=cloudflare
EMAIL_FROM=shop@yourdomain.com
EMAIL_FROM_NAME=Wall Money Shop
COREAPI_WEBHOOK_KEY_URL=https://coreapi.wall.money/obp/v6.0.0/transactions/key
ORDER_STORAGE_PROVIDER=none
REQUIRE_PAYMENT_WEBHOOK=true
```

Fulfillment Worker variables and bindings:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `EMAIL` | Cloudflare Email binding | Required when `EMAIL_PROVIDER=cloudflare` and mode sends email | Cloudflare Email Service binding. Configure in `workers/wrangler.order-fulfillment.jsonc` with `send_email`. |
| `FULFILLMENT_MODE` | Variable | No | Overrides payload mode. Use `email`, `webhook`, `both`, or `none`. |
| `FULFILLMENT_WEBHOOK_URL` | Variable | Required for `webhook` and `both` | Downstream order collection endpoint that receives signed order payloads. |
| `EMAIL_PROVIDER` | Variable | No | `cloudflare`, `http`, or `none`. Defaults to `cloudflare`. |
| `EMAIL_API_URL` | Variable | Required when `EMAIL_PROVIDER=http` | HTTP email provider endpoint. |
| `EMAIL_FROM` | Variable | Required when sending email | Sender address. Must be valid for the selected provider/domain. |
| `EMAIL_FROM_NAME` | Variable | No | Sender display name. |
| `ORDER_DRAFTS` | KV binding | Required when `orderPayment.webhookUrl` is set | Stores prepared order drafts and processed payment markers. |
| `ORDER_DB` | D1 binding | Required when `ORDER_STORAGE_PROVIDER=d1` | Stores paid orders and order line items. Configure with `workers/wrangler.order-fulfillment.d1.jsonc`. |
| `ORDER_STORAGE_PROVIDER` | Variable | No | `none` or `d1`. Defaults to `none`. When `d1`, the Worker stores each paid order in D1 before sending email/webhook fulfillment. |
| `COREAPI_WEBHOOK_KEY_URL` | Variable | Required for verified payment webhooks unless `COREAPI_WEBHOOK_VERIFY_KEY_JWK` or `COREAPI_BASE_URL` is set | Coreapi public JWK set endpoint used to verify signed transfer webhooks. |
| `COREAPI_BASE_URL` | Variable | Optional | Base URL used to derive `/obp/v6.0.0/transactions/key` when `COREAPI_WEBHOOK_KEY_URL` is not set. |
| `STOCK_WEBHOOK_URL` | Variable | Optional | Stock Worker URL. The fulfillment Worker validates stock before payment and decrements stock after a verified executed payment webhook. |
| `REQUIRE_PAYMENT_WEBHOOK` | Variable | Recommended | Set `true` to reject legacy client-submitted `shop.order.paid` payloads. |
| `ORDER_DRAFT_TTL_SECONDS` | Variable | No | Draft and processed marker TTL. Defaults to `86400`. |

Fulfillment Worker secrets:

| Name | Required | Description | Set Command |
| --- | --- | --- | --- |
| `EMAIL_API_TOKEN` | Required when `EMAIL_PROVIDER=http` and provider needs auth | Bearer token sent only from the Worker to the HTTP email provider. | `wrangler secret put EMAIL_API_TOKEN --config workers/wrangler.order-fulfillment.jsonc` |
| `FULFILLMENT_WEBHOOK_SECRET` | Recommended when `FULFILLMENT_WEBHOOK_URL` is set | HMAC signing secret for downstream order webhooks. | `wrangler secret put FULFILLMENT_WEBHOOK_SECRET --config workers/wrangler.order-fulfillment.jsonc` |
| `COREAPI_WEBHOOK_VERIFY_KEY_JWK` | Optional | Inline public JWK used instead of fetching `COREAPI_WEBHOOK_KEY_URL`. | `wrangler secret put COREAPI_WEBHOOK_VERIFY_KEY_JWK --config workers/wrangler.order-fulfillment.jsonc` |
| `STOCK_WEBHOOK_TOKEN` | Required when the stock Worker requires auth | Bearer token sent from the fulfillment Worker to `STOCK_WEBHOOK_URL`. | `wrangler secret put STOCK_WEBHOOK_TOKEN --config workers/wrangler.order-fulfillment.jsonc` |

For Cloudflare Email Service, keep the `EMAIL` binding from `workers/wrangler.order-fulfillment.jsonc`. For a generic HTTP email provider, set:

```text
EMAIL_PROVIDER=http
EMAIL_API_URL=https://your-email-provider.example.com/send
```

Store provider credentials as Worker secrets, never in `src/config.ts`:

```sh
wrangler secret put EMAIL_API_TOKEN --config workers/wrangler.order-fulfillment.jsonc
wrangler secret put FULFILLMENT_WEBHOOK_SECRET --config workers/wrangler.order-fulfillment.jsonc
```

When `FULFILLMENT_WEBHOOK_URL` is configured, the Worker forwards the order payload to that endpoint. If `FULFILLMENT_WEBHOOK_SECRET` is set, the Worker signs `timestamp.body` using HMAC-SHA256 and sends:

```text
X-Signature: sha256=<hex signature>
X-Signature-Timestamp: <ISO timestamp>
```

This keeps the signing secret server-side. The receiver should reject stale timestamps and verify the signature before accepting the order.

For payment reliability, configure `orderPayment.webhookUrl` to the same Worker. Checkout first sends `type: "shop.order.prepare"` to store the full order draft. The transfer URL then includes:

```text
wh=<orderPayment.webhookUrl>
referenceId=<order reference>
```

Coreapi signs transfer webhooks with its private webhook key and exposes the public key set at `/obp/v6.0.0/transactions/key`. The Worker verifies `X-Signature`, accepts only `status: "executed"`, checks the signed webhook reference/amount/currency against the prepared order, then decrements stock and sends fulfillment.

Fulfillment setup:

```sh
# Cloudflare Email Service sender
wrangler email sending enable yourdomain.com

# Optional secrets
wrangler secret put EMAIL_API_TOKEN --config workers/wrangler.order-fulfillment.jsonc
wrangler secret put FULFILLMENT_WEBHOOK_SECRET --config workers/wrangler.order-fulfillment.jsonc

# Deploy the fulfillment Worker
wrangler deploy --config workers/wrangler.order-fulfillment.jsonc
```

The repository also includes Wrangler as an npm dev dependency and exposes a single deployment command for both plugin-owned Workers:

```sh
npm run deploy:workers
```

That command deploys `workers/wrangler.order-stock.jsonc` first, then `workers/wrangler.order-fulfillment.jsonc`. Before running it, replace the placeholder KV namespace IDs in both Wrangler config files and set the required secrets with `wrangler secret put`. If you use the optional D1 catalog source, deploy it separately with `npm run deploy:catalog-db`.

## Optional D1 Order Collection

Orders can be collected in Cloudflare D1 by the fulfillment Worker. This is independent of email and downstream webhook fulfillment: use it as the only collection method with `storage` mode, or store a D1 copy while still sending email/webhook notifications.

Configure plugin checkout to post to the fulfillment Worker:

```js
orderFulfillment: {
  mode: 'storage',
  webhookUrl: 'https://order-fulfillment.example.com/orders/paid'
},
orderPayment: {
  webhookUrl: 'https://order-fulfillment.example.com/orders/payment-webhook'
}
```

Create the D1 orders database once:

```sh
npm run db:orders:create
```

Wrangler prints the database id. Copy it into `workers/wrangler.order-fulfillment.d1.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "ORDER_DB",
    "database_name": "plugin-shop-orders",
    "database_id": "paste-orders-d1-database-id-here",
    "migrations_dir": "../migrations/orders"
  }
]
```

Apply the orders schema and deploy the D1-enabled fulfillment Worker:

```sh
npm run deploy:orders-db
```

For local D1 testing:

```sh
npm run db:orders:migrate:local
wrangler dev --config workers/wrangler.order-fulfillment.d1.jsonc
```

The orders migration lives in `migrations/orders/0001_orders.sql`. It creates:

- `orders` for normalized order/payment/customer fields plus the full JSON payload.
- `order_items` for line items linked to `orders.reference`.

Set `ORDER_STORAGE_PROVIDER=d1` in the Worker config to enable writes. Set `FULFILLMENT_MODE=storage` for D1-only collection, or `email`, `webhook`, or `both` to collect in D1 and still perform those fulfillment actions.

## Optional Stock Management

Stock is optional and intentionally not displayed in the shop UI. If stock management is not configured, or if a purchased item ID is not present in KV, the plugin treats that item as unmanaged and continues normally. Managed stock is checked before opening payment and decremented only after a verified successful payment webhook when `orderPayment.webhookUrl` is configured.

Enable the plugin-owned stock API in `src/config.ts`:

```js
stockManagement: {
  provider: 'api', // "api" or "none"
  apiUrl: 'https://stock.example.com'
}
```

Plugin-side stock config:

| Name | Location | Required | Description |
| --- | --- | --- | --- |
| `stockManagement.provider` | `src/config.ts` | Yes | `api` to call the plugin-owned stock Worker, or `none` to disable stock checks. |
| `stockManagement.apiUrl` | `src/config.ts` | Required when provider is `api` | Public URL of the stock Worker. No secrets are stored here. |

Use `workers/order-stock.ts` as the standalone stock Worker. The Worker supports three modes:

```text
STOCK_PROVIDER=kv
STOCK_PROVIDER=api
STOCK_PROVIDER=none
```

For `kv`, bind a KV namespace named `SHOP_STOCK` using `workers/wrangler.order-stock.jsonc`. Stock keys are item IDs prefixed with `stock:`:

```text
stock:red-tea = 42
stock:coffee = 18
stock:red-rose = 64
```

For `api`, configure an external stock API endpoint in the Worker environment:

```text
STOCK_PROVIDER=api
EXTERNAL_STOCK_API_URL=https://your-stock-api.example.com/stock
```

Stock Worker variables and bindings:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `SHOP_STOCK` | KV binding | Required when `STOCK_PROVIDER=kv` | Cloudflare KV namespace containing `stock:<product-id>` quantities. |
| `STOCK_PROVIDER` | Variable | No | `kv`, `api`, or `none`. Defaults to `kv`. |
| `EXTERNAL_STOCK_API_URL` | Variable | Required when `STOCK_PROVIDER=api` | External stock service endpoint. The Worker forwards validate/decrement payloads to it. |

Stock Worker secrets:

| Name | Required | Description | Set Command |
| --- | --- | --- | --- |
| `EXTERNAL_STOCK_API_TOKEN` | Required when external API needs auth | Bearer token sent from the Worker to `EXTERNAL_STOCK_API_URL`. | `wrangler secret put EXTERNAL_STOCK_API_TOKEN --config workers/wrangler.order-stock.jsonc` |
| `STOCK_WEBHOOK_TOKEN` | Optional | Optional bearer token for calls into the stock Worker. Only use when the caller can set the header. | `wrangler secret put STOCK_WEBHOOK_TOKEN --config workers/wrangler.order-stock.jsonc` |

Store external stock API credentials as Worker secrets:

```sh
wrangler secret put EXTERNAL_STOCK_API_TOKEN --config workers/wrangler.order-stock.jsonc
```

Stock setup:

```sh
# KV mode: create/bind SHOP_STOCK in workers/wrangler.order-stock.jsonc, then deploy
wrangler deploy --config workers/wrangler.order-stock.jsonc

# API mode: set EXTERNAL_STOCK_API_URL in wrangler vars and provider credentials as secrets
wrangler secret put EXTERNAL_STOCK_API_TOKEN --config workers/wrangler.order-stock.jsonc
wrangler deploy --config workers/wrangler.order-stock.jsonc
```

To deploy both stock and fulfillment Workers after configuration:

```sh
npm run deploy:workers
```

Before payment the plugin posts `type: "shop.order.prepare"` to the fulfillment Worker when `orderPayment.webhookUrl` is set; that Worker validates stock with the stock Worker using `type: "shop.stock.validate"`. Without the payment webhook flow, the plugin can still post `type: "shop.stock.validate"` directly to the stock Worker. If a managed item has less stock than requested, the portal blocks payment and updates the cart to the available amount, or removes the item when available stock is zero. Missing keys mean no stock management for that item.

After a verified successful payment webhook, the fulfillment Worker posts `type: "shop.stock.decrement"` with the same item quantities. The stock Worker refuses over-decrementing and only writes decrements when all managed items have enough stock.

## IPFS-First Catalog Model

The plugin avoids an external database:

- Product descriptions, images, and metadata should be uploaded to IPFS by the merchant.
- The catalog can be represented by a CID or IPNS name.
- The plugin uses `https://ipf.sk` for IPFS/IPNS gateway resolution. That gateway Worker tries multiple public IPFS gateways and returns the first successful response.
- Portal plugin storage is used only for local UX state: cart, draft checkout, saved delivery profile, and order status.

This repo currently uses IPFS for the catalog and does not keep `data/catalog.json` in the tree. If you add that file temporarily, this command validates it and refreshes `src/inventory.ts`:

```sh
npm run build:catalog
```

If `data/catalog.json` is missing, the command leaves the existing `src/inventory.ts` bundled fallback unchanged.

Example catalog shape:

```json
{
  "version": 1,
  "categories": [
    {
      "id": "pantry",
      "label": "Pantry",
      "helper": "Shelf-stable goods",
      "order": 1
    }
  ],
  "products": [
    {
      "id": "coffee-001",
      "name": "Origin Coffee",
      "category": "pantry",
      "price": 18,
      "cid": "bafy...",
      "description": "Small batch coffee beans."
    }
  ]
}
```

To load the catalog remotely, set `SHOP_CONFIG.defaultCatalogRef` in `src/config.ts` to any of:

```js
defaultCatalogRef: 'ipfs://bafy...'
defaultCatalogRef: 'ipfs://bafy.../catalog.json'
defaultCatalogRef: 'ipns://your-name.example/catalog.json'
defaultCatalogRef: 'ipfs/bafy.../catalog.json'
defaultCatalogRef: 'https://ipf.sk/ipfs/bafy.../catalog.json'
```

When `defaultCatalogRef` is set to an IPFS/IPNS/HTTPS value, the plugin loads that remote catalog first even though the bundled fallback exists. The fallback is only used when `defaultCatalogProvider` is `local`, or when the user selects `Use local catalog` after a remote load error.

`ipns://` is ideal when the merchant wants to update the catalog without changing plugin code. `ipfs://` is ideal when the catalog should be immutable. The gateway defaults to `https://ipf.sk`, and the plugin resolves:

```text
ipfs://<cid> -> https://ipf.sk/ipfs/<cid>
ipfs://<cid>/catalog.json -> https://ipf.sk/ipfs/<cid>/catalog.json
ipns://<name>/catalog.json -> https://ipf.sk/ipns/<name>/catalog.json
```

IPFS/IPNS gateways can be slow when content is newly published. The plugin waits up to 12 seconds per request and tries the initial request plus 2 retries. Each request goes through `https://ipf.sk`, which races configured public IPFS gateways and uses the first successful response. If the catalog still cannot be loaded, the plugin shows the error and a `Retry` button. The user can also switch back to the local bundled catalog from that error screen.

## D1 Catalog Model

If the merchant wants mutable categories and products without publishing a new IPFS/IPNS object, enable the D1 catalog source. The plugin still receives the same catalog JSON shape; D1 is hidden behind `workers/catalog-d1.ts`.

Configure `src/config.ts`:

```js
defaultCatalogProvider: 'd1',
catalogD1: {
  apiUrl: 'https://catalog.example.com/catalog'
}
```

Create the D1 database once:

```sh
npm run db:catalog:create
```

Wrangler prints the new database id. Copy it into `workers/wrangler.catalog-d1.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "CATALOG_DB",
    "database_name": "plugin-shop-catalog",
    "database_id": "paste-d1-database-id-here",
    "migrations_dir": "../migrations/catalog"
  }
]
```

Apply the schema migration and deploy the catalog Worker:

```sh
npm run deploy:catalog-db
```

This command asks whether to inject demo categories and products from `seeds/catalog/products.sql`. Choose `y` only when you want demo rows in D1. Choose `N` for a production database that will be populated with merchant data separately.

To run the steps manually:

```sh
npm run db:catalog:migrate
npm run db:catalog:demo # optional demo data
npm run deploy:worker:catalog
```

For local D1 testing with Wrangler:

```sh
npm run db:catalog:migrate:local
npm run db:catalog:demo:local # optional demo data
wrangler dev --config workers/wrangler.catalog-d1.jsonc
```

The migrations live in `migrations/catalog/`:

- `0001_catalog.sql` creates `categories` and `products`.

Demo data lives in `seeds/catalog/products.sql` and mirrors the bundled fallback catalog. It is never applied by migrations; it is only injected when the user explicitly chooses it or runs `npm run db:catalog:demo`. Update rows directly through D1 or add merchant-owned migration files for production data. The Worker returns only rows where `enabled = 1`, ordered by `display_order`.

## Portal Integration

The plugin uses:

- `storage.get`, `storage.set`, and `storage.remove` for local cart/profile/order state.
- `payments.openPrefilledPayment` for Wall Money checkout.
- `events.onPaymentExecuted` to update order status after payment.
- `network.getJson` to load remote IPFS/IPNS catalog JSON through the configured gateway.
- `network.postJson` to notify plugin-owned order fulfillment and optional stock webhooks after successful payment.
- `user.getCoreId` to prefill the customer Core ID when available.
- `ui.navigate`, `ui.toast`, and `ui.notify` for links and status feedback.

## Files

```text
package.json Plugin manifest consumed by Wall Money marketplace
icon.svg     Marketplace/plugin icon
app/         SvelteKit preview source
src/         Portal plugin source split into logical parts
dist/        Compiled marketplace plugin bundle
build/       Static SvelteKit preview output
README.md    This documentation
```

## Development Checks

Run checks:

```sh
npm run check
```

Check whitespace:

```sh
git diff --check
```
