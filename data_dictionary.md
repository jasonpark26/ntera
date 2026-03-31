# Data dictionary (MVP)

## city_statistical_audit_bottom50_top50.csv / city_statistical_audit_q1q5.csv
- feed_name: transit system identifier (GTFS feed)
- city: display label for the system (best-effort)
- prov: province/territory code (e.g., ON, BC)
- neighborhoods: number of neighborhood geographies contributing

Weekday (wk) / Weekend (we) gap metrics:
- wait_gap_wk_med: median(wait_low) - median(wait_high), minutes. Positive => lower-income has longer scheduled waits.
- wait_gap_wk_ci_low / wait_gap_wk_ci_high: bootstrap 95% CI
- wait_gap_wk_p: Mann–Whitney U p-value (two-sided)

- dens_gap_wk_med: median(density_low) - median(density_high), trips/km². Negative => lower-income has lower scheduled density.
- dens_gap_wk_ci_low / dens_gap_wk_ci_high: bootstrap 95% CI
- dens_gap_wk_p: Mann–Whitney U p-value (two-sided)

Weekend equivalents use *_we_* columns.

## province_statistical_summary_*.csv
- prov: province/territory code
- cities: number of systems in that province
- median_wait_gap_wk, median_dens_gap_wk: province median of city/system gaps

## summary.json
- desert_rate_overall_pct, desert_rate_q1_pct, desert_rate_q5_pct
- weekday_wait_non_null_pct, weekday_density_non_null_pct
- bottom50_top50 / q1_vs_q5: city-level median gaps (weekdays)
