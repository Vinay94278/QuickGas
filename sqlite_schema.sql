CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
CREATE TABLE gases (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	unit VARCHAR(50), 
	description VARCHAR(500), 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
CREATE TABLE order_status (
	id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
CREATE TABLE roles (
	id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
CREATE TABLE users (
	id INTEGER NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	phone VARCHAR(50), 
	email VARCHAR(255), 
	address VARCHAR(500), 
	company_id INTEGER NOT NULL, 
	role_id INTEGER NOT NULL, 
	password_hash VARCHAR(255), 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id), 
	UNIQUE (email)
);
CREATE TABLE order_items (
	id INTEGER NOT NULL, 
	order_id INTEGER NOT NULL, 
	gas_id INTEGER NOT NULL, 
	quantity INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(gas_id) REFERENCES gases (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "companies" (
	id INTEGER NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	address VARCHAR(500), 
	is_deleted BOOLEAN, 
	created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_company_name UNIQUE (name)
);
CREATE TABLE orders (
    id INTEGER NOT NULL, 
    company_id INTEGER NOT NULL, 
    status_id INTEGER NOT NULL, 
    admin_id INTEGER NOT NULL, 
    driver_id INTEGER, 
    area VARCHAR(255) NOT NULL, 
    mobile_no VARCHAR(20), 
    notes TEXT, 
    is_deleted BOOLEAN, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(company_id) REFERENCES companies (id), 
    FOREIGN KEY(status_id) REFERENCES order_status (id), 
    FOREIGN KEY(admin_id) REFERENCES users (id), 
    FOREIGN KEY(driver_id) REFERENCES users (id)
);
sqlite3 is not installed, but available in the following packages, pick one to run it, Ctrl+C to cancel.
