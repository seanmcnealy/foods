CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY,
    brand_id TEXT NOT NULL,
    name TEXT NOT NULL,
    extref TEXT NOT NULL,
    sortorder SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS product (
   id INTEGER PRIMARY KEY,
   brand_id TEXT NOT NULL,
   category_id INTEGER REFERENCES category(id) NOT NULL,
   chainproduct_id INTEGER NOT NULL,
   name TEXT NOT NULL,
   description TEXT,
   cost NUMERIC,
   base_calories INTEGER,
   max_calories INTEGER,
   extref TEXT NOT NULL,
   is_disabled BOOLEAN,
   minimum_quantity INTEGER,
   quantity_increment INTEGER,
   short_description TEXT,
   calories_separator TEXT,
   sort_order SMALLINT NOT NULL,
   price NUMERIC
);

CREATE TABLE IF NOT EXISTS option_group (
    id INTEGER PRIMARY KEY,
    brand_id TEXT NOT NULL,
    description TEXT,
    mandatory BOOLEAN,
    supports_choice_quantities BOOLEAN,
    choice_quantity_increment INTEGER,
    explanation_text TEXT,
    sort_order SMALLINT
);

CREATE TABLE IF NOT EXISTS option (
    id INTEGER PRIMARY KEY,
    brand_id TEXT NOT NULL,
    name TEXT,
    is_default BOOLEAN,
    cost NUMERIC,
    adjusts_parent_calories BOOLEAN,
    adjusts_parent_price BOOLEAN,
    sort_order SMALLINT,
    price NUMERIC
);

CREATE TABLE IF NOT EXISTS option_group_option_link (
    option_group_id INTEGER REFERENCES option_group(id),
    option_id INTEGER REFERENCES option(id),
    UNIQUE(option_group_id, option_id)
);

CREATE TABLE IF NOT EXISTS product_option_group_link (
    product_id INTEGER REFERENCES product(id),
    option_group_id INTEGER REFERENCES option_group(id),
    UNIQUE(product_id, option_group_id)
);

CREATE TABLE IF NOT EXISTS option_option_group_link (
    option_id INTEGER REFERENCES option(id),
    option_group_id INTEGER REFERENCES option_group(id),
    UNIQUE(option_id, option_group_id)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public to gotofoods;
