INSERT INTO categories (id, label, helper, display_order, enabled)
VALUES
	('tea', 'Tea', 'Leafy rituals and warm cups', 1, 1),
	('coffee', 'Coffee', 'Roasted daily essentials', 2, 1),
	('flowers', 'Flowers', 'Fresh stems and soft color', 3, 1)
ON CONFLICT(id) DO UPDATE SET
	label = excluded.label,
	helper = excluded.helper,
	display_order = excluded.display_order,
	enabled = excluded.enabled,
	updated_at = CURRENT_TIMESTAMP;

INSERT INTO products (id, name, category, price, icon, cid, description, vendor, badge, pack_label, digital, display_order, enabled)
VALUES
	('red-tea', 'Red Tea', 'tea', 12, '🍵', 'bafybeiev3uiuiwi26zchkmxqpepoaz5rieiivq6yk4tcutjbsixtozriya', 'A mellow red tea with a ruby cup, gentle tannins, and a naturally sweet finish. Ideal for slow mornings or an afternoon reset.', 'Wall Money Pantry', 'Popular', '80g pouch', 0, 1, 1),
	('turkish-tea', 'Turkish Tea', 'tea', 14, '🫖', 'bafybeidasvv63e3xchk6hbe4vde3grlc652qa6io2s3pw7y5vqrwiohehu', 'Bold black tea inspired by Turkish tea gardens. Brew it strong, serve it bright, and keep the second glass close.', 'Wall Money Pantry', 'Fresh', '100g tin', 0, 2, 1),
	('coffee', 'Coffee', 'coffee', 18, '☕', 'bafybeibi24hc42onhxq3dqyphnen2aklv4uplbozeifvay7vmw43mmbhzi', 'A balanced roast with cocoa depth, toasted sugar, and a clean finish. Built for both espresso and quiet filter brews.', 'Wall Money Roasters', 'Top pick', '250g bag', 0, 3, 1),
	('red-rose', 'Red Rose', 'flowers', 9, '🌹', 'bafybeihny5f3zl3ir3423a3eh2zw4emcm3z54r5emm4qgrhtfglumk5wle', 'A classic red rose selected for deep color and long vase life. Simple, direct, and somehow still undefeated.', 'Wall Money Florist', 'Giftable', 'Single stem', 0, 4, 1),
	('tulip', 'Tulip', 'flowers', 7, '🌷', 'bafybeib2xc5krqhdgzfgyfgnc2bjkuanwmsnbco37s735qnkb43mqf6rd4', 'A bright tulip stem with a clean silhouette and spring energy. Lovely alone, better in a small bunch.', 'Wall Money Florist', 'Seasonal', 'Single stem', 0, 5, 1)
ON CONFLICT(id) DO UPDATE SET
	name = excluded.name,
	category = excluded.category,
	price = excluded.price,
	icon = excluded.icon,
	cid = excluded.cid,
	description = excluded.description,
	vendor = excluded.vendor,
	badge = excluded.badge,
	pack_label = excluded.pack_label,
	digital = excluded.digital,
	display_order = excluded.display_order,
	enabled = excluded.enabled,
	updated_at = CURRENT_TIMESTAMP;
