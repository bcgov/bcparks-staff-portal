## Strapi data extraction

Data is extracted from Strapi via SQL queries because the REST API does not expose `created_by_id` and `updated_by_id`. When data is added to Strapi through API calls, these fields are always `null`. Therefore, if records were added or edited by a human, these fields will be non-null.

Connect to one of the `crunchy-postgres-ha` pods in prod and run the following commands. The commands below assume you are connecting to `crunchy-postgres-ha-pmhw`.

`psql -d cms`

```sql
\pset tuples_only on
\pset format unaligned
\o /tmp/feature-dates.json

SELECT json_agg(row_to_json(t))
FROM (
    SELECT distinct
        pdt.date_type_id,
        pf.orcs_feature_number,
        pd.name,
        pd.is_date_annual,
        EXTRACT(YEAR FROM pd.start_date)::int AS operating_year,
        pd.start_date,
        pd.end_date
    FROM park_dates pd
    INNER JOIN park_dates_park_date_type_lnk pdpdtl
        ON pdpdtl.park_date_id = pd.id
    INNER JOIN park_date_types pdt
        ON pdt.id = pdpdtl.park_date_type_id
    INNER JOIN park_dates_park_feature_lnk pdpfl
        ON pdpfl.park_date_id = pd.id
    INNER JOIN park_features pf
        ON pf.id = pdpfl.park_feature_id
    WHERE pd.start_date >= '2026-01-01'
      AND (pd.created_by_id IS NOT NULL OR pd.updated_by_id IS NOT NULL)
      AND pd.is_active = TRUE
      AND pd.published_at IS NOT NULL
    ORDER BY pf.orcs_feature_number, pdt.date_type_id, pd.start_date
) t;


\o /tmp/protected-area-dates.json

SELECT json_agg(row_to_json(t))
FROM (
    SELECT distinct
        pdt.date_type_id,
        pa.orcs,
        pd.name,
        pd.is_date_annual,
        EXTRACT(YEAR FROM pd.start_date)::int AS operating_year,
        pd.start_date,
        pd.end_date
    FROM park_dates pd
    INNER JOIN park_dates_park_date_type_lnk pdpdtl
        ON pdpdtl.park_date_id = pd.id
    INNER JOIN park_date_types pdt
        ON pdt.id = pdpdtl.park_date_type_id
    INNER JOIN park_dates_protected_area_lnk pdpal
        ON pdpal.park_date_id = pd.id
    INNER JOIN protected_areas pa
        ON pa.id = pdpal.protected_area_id
    WHERE pd.start_date >= '2026-01-01'
      AND (pd.created_by_id IS NOT NULL OR pd.updated_by_id IS NOT NULL)
      AND pd.is_active = TRUE
      AND pd.published_at IS NOT NULL
    ORDER BY pa.orcs, pdt.date_type_id, pd.start_date
) t;

\o
```

Now log in to the `oc` console locally and run the following commands (update the `cd` path for your workstation):

```bash
oc project c1643c-prod

cd ~/Work/bcparks-staff-portal/backend/tasks/import-2026-strapi-dates

oc cp crunchy-postgres-ha-pmhw-0:/tmp/feature-dates.json ./feature-dates.json
oc cp crunchy-postgres-ha-pmhw-0:/tmp/protected-area-dates.json ./protected-area-dates.json
```

Save the files in VS Code to apply prettier formatting.
