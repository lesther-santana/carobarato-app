CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE public.products
(
    product_id uuid DEFAULT uuid_generate_v4(),
    supermercado character varying(50) NOT NULL,
    product_name text NOT NULL,
    product_url text NOT NULL,
    img_url text,
    slug text,
    brand text,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    CONSTRAINT name_url UNIQUE (product_name, product_url)
);

ALTER TABLE IF EXISTS public.products
    OWNER to postgres;