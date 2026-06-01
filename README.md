# IPFS Shop Wall Money Plugin

IPFS Shop is a Wall Money marketplace plugin for running a lightweight ecommerce storefront without a server database.

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

Edit source files in `src/`; the portal reads the ordered `src` list from `package.json` and builds the runtime bundle during install/update.

```text
src/config.js       Merchant-editable categories, sample products, and defaults
src/state.js        Local plugin state normalization and storage actions
src/catalog.js      Category/product filtering and IPFS gateway URL helpers
src/cart.js         Cart totals, quantity actions, order references
src/ui/products.js  Product overview, category filters, listing cards
src/ui/cart.js      Shopping cart view
src/ui/checkout.js  Delivery details and Wall Money payment action
src/ui/orders.js    Local order result view
src/ui/settings.js  Gateway/provider/settings UI
src/plugin.js       Portal runtime entrypoint
```

## Portal Source Loading

The plugin does not need local build scripts. `package.json` declares source files in execution order:

```json
"src": [
  "src/config.js",
  "src/state.js",
  "src/plugin.js"
]
```

At install/update time, the portal fetches those files, concatenates them into the sandbox runtime source, and stores that generated runtime internally. Plugins are source-first; the portal can still use a manifest `bundle` as a backup for older or single-file plugins when `src` is not defined.

## Configurable Categories

Categories are defined in `src/config.js`:

```js
const SHOP_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🧺', helper: 'Everything' },
  { id: 'pantry', label: 'Pantry', icon: '☕', helper: 'Food and drinks' }
];
```

Products reference those categories by `category` id. No build step is needed after changing categories or products.

The plugin UI is rendered by the portal’s schema renderer, which already uses Tailwind utility classes for the dark rounded card layout, badges, buttons, forms, and responsive grids. The plugin shapes its UI into those Tailwind-rendered components to get a Plebeian Market-style marketplace feel while staying compatible with the portal sandbox.

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
- `user.getCoreId` to prefill the customer Core ID when available.
- `ui.navigate`, `ui.toast`, and `ui.notify` for links and status feedback.

## Files

```text
package.json Plugin manifest consumed by Wall Money marketplace
icon.svg     Marketplace/plugin icon
src/         Source split into logical parts
README.md    This documentation
```

## Development Checks

Check whitespace in the repo:

```sh
git diff --check
```
