CREATE TABLE public.prices
(
    price_id uuid DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL,
    list_price numeric(7, 2) NOT NULL,
    discounted_price numeric(7, 2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (price_id),
    CONSTRAINT prices_products_product_id_fk FOREIGN KEY (product_id)
        REFERENCES public.products (product_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS public.prices
    OWNER to postgres;