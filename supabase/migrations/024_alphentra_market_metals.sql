-- Alphentra Database Migration 024
-- Add a first-class metals asset class so MT5 metals are not conflated
-- with the broader commodity category.

ALTER TYPE public.market_asset_class
ADD VALUE IF NOT EXISTS 'metals';
