CREATE TABLE IF NOT EXISTS categories (
	id TEXT PRIMARY KEY,
	label TEXT NOT NULL,
	helper TEXT NOT NULL DEFAULT '',
	display_order INTEGER NOT NULL DEFAULT 999,
	enabled INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	category TEXT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
	price REAL NOT NULL CHECK (price >= 0),
	icon TEXT NOT NULL DEFAULT '',
	cid TEXT NOT NULL DEFAULT '',
	image_cid TEXT NOT NULL DEFAULT '',
	image_url TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	vendor TEXT NOT NULL DEFAULT '',
	badge TEXT NOT NULL DEFAULT '',
	pack_label TEXT NOT NULL DEFAULT '',
	digital INTEGER NOT NULL DEFAULT 0 CHECK (digital IN (0, 1)),
	display_order INTEGER NOT NULL DEFAULT 999,
	enabled INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_enabled_order ON products(enabled, display_order, name);
CREATE INDEX IF NOT EXISTS idx_categories_enabled_order ON categories(enabled, display_order, label);
