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

Edit the SvelteKit preview in `app/` and the portal plugin runtime in `src/`. The marketplace installs the compiled `dist/plugin.js` bundle.

```text
app/routes/+page.svelte      SvelteKit shop preview UI
data/categories.json        Merchant-editable category list
data/inventory/*.json       One merchant-editable inventory item per file
scripts/build-inventory.mjs Generates src/inventory.js from data files
scripts/build-plugin.mjs    Compiles ordered plugin source into dist/plugin.js
workers/order-email.ts      Optional external order-email webhook
workers/wrangler.order-email.jsonc Example Cloudflare Worker email config
src/config.js               Shop defaults
src/inventory.js            Generated categories and products
src/state.js        Local plugin state normalization and storage actions
src/catalog.js      Category/product filtering and IPFS gateway URL helpers
src/cart.js         Cart totals, quantity actions, order references
src/ui/products.js  Shop-style category grid and product detail UI
src/ui/cart.js      Shopping cart view
src/ui/checkout.js  Delivery details and Wall Money payment action
src/ui/orders.js    Local order result view
src/ui/settings.js  Gateway/provider/settings UI
src/email.js        Admin order email composition
src/plugin.js       Portal runtime entrypoint
dist/plugin.js      Generated marketplace bundle
build/              Generated static SvelteKit preview
```

## Build Outputs

The portal plugin sandbox cannot execute a SvelteKit app directly. This repo therefore builds two useful outputs:

- `dist/plugin.js` — marketplace-ready plugin bundle consumed by `package.json` via `"bundle"`.
- `build/` — static SvelteKit preview for local design/development.

Build both:

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

## Configurable Categories And Inventory

Categories are defined in `data/categories.json`:

```json
[
  { "id": "tea", "label": "Tea", "helper": "Leafy rituals and warm cups", "order": 1 },
  { "id": "coffee", "label": "Coffee", "helper": "Roasted daily essentials", "order": 2 },
  { "id": "flowers", "label": "Flowers", "helper": "Fresh stems and soft color", "order": 3 }
]
```

Products live as one file per inventory item in `data/inventory`. Example:

```json
{
  "id": "red-tea",
  "name": "Red Tea",
  "category": "tea",
  "price": 12,
  "currency": "USDX",
  "cid": "bafybeiev3uiuiwi26zchkmxqpepoaz5rieiivq6yk4tcutjbsixtozriya",
  "description": "A mellow red tea with a ruby cup, gentle tannins, and a naturally sweet finish.",
  "stock": 42
}
```

After editing categories or inventory, regenerate the bundled source:

```sh
npm run build:plugin
```

The plugin UI is rendered by the portal’s schema renderer. The shop uses richer shop-specific schema nodes for a light product-grid experience, category rail, product detail page, and a bottom-left CoreID identicon that navigates back to the bank portal.

## Order Email Webhook

The portal does not store shop email credentials and does not send shop emails. After a successful payment, the plugin posts the order payload to the plugin-owned webhook configured in `src/config.js`:

```js
orderEmail: {
  provider: 'webhook',
  adminEmail: 'admin@example.com',
  webhookUrl: 'https://shop-email.example.com/orders/paid',
  authHeader: ''
}
```

Use `workers/order-email.ts` as an example standalone email webhook. With Cloudflare Email Service, credentials/config live in the worker environment:

```text
EMAIL_FROM=shop@yourdomain.com
EMAIL_FROM_NAME=Wall Money Shop
ORDER_WEBHOOK_TOKEN=optional-shared-token
```

If `ORDER_WEBHOOK_TOKEN` is set, put `Bearer optional-shared-token` into `orderEmail.authHeader`. The worker receives the order items, delivery details, payment reference/session, customer reply-to email, and rendered email body, then sends the email using its own email provider binding.

## IPFS-First Catalog Model

The plugin avoids an external database:

- Product descriptions, images, and metadata should be uploaded to IPFS by the merchant.
- The catalog can be represented by a CID or IPNS name.
- The configured gateway defaults to `https://ipf.sk`, which supports path-based and subdomain IPFS/IPNS access.
- The upload provider URL is merchant-defined and opened externally from the plugin.
- Portal plugin storage is used only for local UX state: cart, draft checkout, saved delivery profile, and merchant settings.

Example catalog shape:

```json
{
  "version": 1,
  "updatedAt": "2026-05-29T00:00:00.000Z",
  "products": [
    {
      "id": "coffee-001",
      "name": "Origin Coffee",
      "category": "Pantry",
      "price": 18,
      "currency": "USDX",
      "cid": "bafy...",
      "description": "Small batch coffee beans."
    }
  ]
}
```

Current portal sandbox APIs do not expose plugin network fetch, so this version ships with a sample catalog and lets merchants configure the IPFS gateway/catalog/provider links. Once the portal exposes a safe fetch capability, the plugin can load catalog JSON directly from the configured CID/IPNS value.

## Portal Integration

The plugin uses:

- `storage.get`, `storage.set`, and `storage.remove` for local cart/profile/config.
- `payments.openPrefilledPayment` for Wall Money checkout.
- `events.onPaymentExecuted` to update order status after payment.
- `network.postJson` to notify the plugin-owned order email webhook after successful payment.
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
