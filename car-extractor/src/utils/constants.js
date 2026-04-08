/**
 * Shared application constants.
 *
 * FIX #9 (PRICE_CHANGE_TTL_MS duplication):
 * Both useBackgroundJob.js and VehicleDatabaseTab.jsx previously defined
 * this constant independently. A single source of truth prevents drift.
 */

/** After this many ms with no new price change, the badge expires. 7 days. */
export const PRICE_CHANGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Maximum number of historical price entries kept per vehicle snapshot. */
export const MAX_PRICE_HISTORY = 20;

/** Delay between listing fetches during a background scan (ms). */
export const SCAN_DELAY_MS = 2500;

/** Maximum search-results pages to scrape in a single batch. */
export const MAX_PAGES_AUTO = 12;
