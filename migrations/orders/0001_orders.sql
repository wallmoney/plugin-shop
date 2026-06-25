CREATE TABLE IF NOT EXISTS orders (
	reference TEXT PRIMARY KEY,
	status TEXT NOT NULL DEFAULT 'paid',
	transaction_id TEXT,
	session_id TEXT,
	total REAL,
	currency TEXT,
	customer_name TEXT,
	customer_email TEXT,
	paid_at TEXT,
	payment_json TEXT NOT NULL DEFAULT '{}',
	customer_json TEXT NOT NULL DEFAULT '{}',
	delivery_json TEXT NOT NULL DEFAULT '{}',
	payload_json TEXT NOT NULL DEFAULT '{}',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
	order_reference TEXT NOT NULL REFERENCES orders(reference) ON DELETE CASCADE,
	line_index INTEGER NOT NULL,
	product_id TEXT,
	name TEXT,
	quantity INTEGER,
	unit_price TEXT,
	line_total TEXT,
	cid TEXT,
	payload_json TEXT NOT NULL DEFAULT '{}',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (order_reference, line_index)
);

CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
