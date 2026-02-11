# Migration Log

This file tracks which migrations have been applied to each environment.
The database's `supabase_migrations.schema_migrations` table is the true source of truth.
This log provides a quick human-readable overview for code reviews and planning.

**Environments:**
- **Gamma** (staging): `oeqgpubjdeomnfunezot`
- **Production**: `syoxdgxffdvvpguzvcxo`

## Baseline Migrations (Pre-Tracking)

These 44 migrations were applied to both environments before this tracking system was established.
They are documented in `00000000000000_baseline_schema.sql` as a cumulative reference snapshot.

| Version | Name | Gamma | Production | Notes |
|---|---|---|---|---|
| 20250904025146 | add_price_columns_to_pokemon_cards | 2025-09-04 | 2025-09-04 | Initial price columns |
| 20250904042137 | fix_pricing_schema_to_jsonb | 2025-09-04 | 2025-09-04 | Changed pricing to JSONB |
| 20250922011328 | add_supplemental_sets_columns | 2025-09-22 | 2025-09-22 | Secondary logo/symbol for sets |
| 20250923040311 | add_variant_columns_and_products | 2025-09-23 | 2025-09-23 | Variant booleans + products table |
| 20250923040549 | migrate_existing_data_to_products_structure | 2025-09-23 | 2025-09-23 | Data migration for products |
| 20250928105030 | add_multi_group_tcgplayer_support | 2025-09-28 | 2025-09-28 | Multi-group TCGPlayer support |
| 20250928111516 | replace_group_ids_with_rich_objects | 2025-09-28 | 2025-09-28 | JSONB group objects |
| 20251005113405 | add_variant_pattern_to_collection_cards | 2025-10-05 | 2025-10-05 | variant_pattern column |
| 20251006123602 | update_unique_constraint_for_variant_pattern | 2025-10-06 | 2025-10-06 | Updated unique constraint |
| 20251026233409 | update_profile_functions_security_fixes | 2025-10-26 | 2025-10-26 | Security hardening for profiles |
| 20251229034920 | add_tcgplayer_set_id_to_pokemon_sets | 2025-12-29 | 2025-12-29 | tcgplayer_set_id column |
| 20251229051835 | create_pokemon_card_prices_table | 2025-12-29 | 2025-12-29 | Dedicated card prices table |
| 20251229070746 | add_rls_policies_to_pokemon_card_prices | 2025-12-29 | 2025-12-29 | RLS for card prices |
| 20260109040803 | create_collection_card_gradings_table | 2026-01-09 | 2026-01-09 | Gradings table |
| 20260109041913 | create_collection_card_gradings_indexes | 2026-01-09 | 2026-01-09 | Gradings indexes |
| 20260109043530 | create_collection_card_gradings_rls | 2026-01-09 | 2026-01-09 | Gradings RLS policies |
| 20260109043829 | create_collection_card_images_bucket | 2026-01-09 | 2026-01-09 | Storage bucket for card images |
| 20260110031804 | add_refund_user_credit_function | 2026-01-10 | 2026-01-10 | Credit refund function |
| 20260110042319 | drop_unused_grading_columns | 2026-01-10 | 2026-01-10 | Removed unused grading columns |
| 20260111010239 | add_show_grading_tips_to_profiles | 2026-01-11 | 2026-01-11 | Grading tips preference |
| 20260114061809 | create_portfolio_snapshots_table | 2026-01-14 | 2026-01-14 | Portfolio value tracking |
| 20260114061825 | create_snapshot_all_portfolios_function | 2026-01-14 | 2026-01-14 | Daily snapshot function |
| 20260114072202 | add_variant_pattern_to_pokemon_card_prices | 2026-01-14 | 2026-01-14 | variant_pattern on prices |
| 20260114072848 | update_snapshot_portfolios_with_variant_pattern | 2026-01-14 | 2026-01-14 | Snapshot uses variant_pattern |
| 20260116043730 | rename_total_value_to_total_card_value | 2026-01-16 | 2026-01-16 | Column rename for clarity |
| 20260116043847 | update_snapshot_function_column_name | 2026-01-16 | 2026-01-16 | Function updated for rename |
| 20260116044101 | rename_product_value_to_total_product_value | 2026-01-16 | 2026-01-16 | Column rename for clarity |
| 20260116044155 | update_snapshot_function_product_column_name | 2026-01-16 | 2026-01-16 | Function updated for rename |
| 20260117060627 | create_pokemon_product_prices_table | 2026-01-17 | 2026-01-17 | Dedicated product prices table |
| 20260117061742 | fix_pokemon_card_prices_numeric_overflow | 2026-01-17 | 2026-01-17 | Fixed numeric precision |
| 20260117064750 | add_rls_policies_pokemon_product_prices | 2026-01-17 | 2026-01-17 | RLS for product prices |
| 20260117235230 | add_last_scraped_at_to_product_prices | 2026-01-17 | 2026-01-17 | Scrape tracking column |
| 20260118040109 | remove_deprecated_price_columns_from_pokemon_products | 2026-01-18 | 2026-01-18 | Cleanup deprecated columns |
| 20260118040525 | remove_deprecated_price_columns_from_pokemon_cards | 2026-01-18 | 2026-01-18 | Cleanup deprecated columns |
| 20260118060835 | restore_price_columns_to_pokemon_cards | 2026-01-18 | 2026-01-18 | Restored needed columns |
| 20260118060842 | restore_price_columns_to_pokemon_products | 2026-01-18 | 2026-01-18 | Restored needed columns |
| 20260118215339 | create_pokemon_product_price_history | 2026-01-18 | 2026-01-18 | Historical product prices |
| 20260119032300 | remove_pokemon_cards_price_columns | 2026-01-19 | 2026-01-19 | Final cleanup of card price cols |
| 20260119033209 | remove_pokemon_products_price_columns | 2026-01-19 | 2026-01-19 | Final cleanup of product price cols |
| 20260119173928 | create_pokemon_product_latest_prices_view | 2026-01-19 | 2026-01-19 | Latest prices view |
| 20260120011441 | create_collection_products | 2026-01-20 | 2026-01-20 | User product collections |
| 20260120041018 | update_snapshot_all_portfolios_include_products | 2026-01-20 | 2026-01-20 | Snapshot includes products |
| 20260121064430 | add_current_market_price_variant_column | 2026-01-21 | 2026-01-21 | Market price variant tracking |
| 20260125013332 | consolidate_raw_history_columns | 2026-01-25 | 2026-01-25 | Consolidated history columns |

## New Migrations (Tracked)

New migrations applied after this tracking system was established go below.
Follow the workflow: apply to gamma first, test, then apply to production.

| Version | Name | Gamma | Production | Notes |
|---|---|---|---|---|
| 20260202051137 | create_waitlist_signups_table | 2026-02-02 | 2026-02-02 | Pre-launch waitlist email collection with RLS |
| 20260206000000 | drop_manual_card_columns | 2026-02-06 | 2026-02-06 | Remove unused manual_* columns and index from collection_cards |
| 20260210000000 | create_user_settings_table | 2026-02-10 | 2026-02-10 | Private user settings table with RLS, migrates show_grading_tips from profiles |
| 20260210000001 | drop_show_grading_tips_from_profiles | 2026-02-10 | 2026-02-10 | Remove show_grading_tips from profiles (moved to user_settings) |
| 20260210000002 | add_user_settings_to_signup_trigger | 2026-02-10 | 2026-02-10 | Update signup trigger to create user_settings, backfill existing users |
