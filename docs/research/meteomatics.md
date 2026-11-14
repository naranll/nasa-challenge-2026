# Meteomatics: can we download weather from 2002 to 2026? (PLAN D15 gate)

**Answer: NOT CHECKED YET.** Replace this line with YES or NO after running the check below.

## Why it matters
The forecast model's v2 features (PLAN D15) need monthly weather per region for 2002–2026.
If the account cannot reach back to 2002, we ship the model with v1 features only (fire history), and the demo must not say "v2".

## What we know before checking (from Meteomatics' own pages, PLAN §11)
- A Free Basic account only has about the last 24 hours of history, so it cannot be used for training.
- A Space Apps or trial account is needed for long history. The query limit has to be confirmed on the account.

## How to check
1. Put `METEOMATICS_USER` and `METEOMATICS_PASSWORD` in `.env` (never commit it).
2. Run:
   ```bash
   python etl/weather/check_meteomatics.py
   ```
   It requests 3 days of daily 2 m temperature at Ulaanbaatar at the start (2002-07) and the end (2026-10) of the period, using 2 queries.
3. Write the printed YES or NO at the top of this file, with the date, the account type and the query limit.

## Result
| Date checked | Account type | Query limit | 2002-07 | 2026-10 | Answer |
|---|---|---|---|---|---|
| | | | | | |
