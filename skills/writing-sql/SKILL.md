---
name: writing-sql
description: Use when writing, editing, or reviewing any SQL — including inline queries in PHP adapters, migration DDL, or raw SQL files. Enforces project SQL formatting conventions.
---

# Writing SQL

## Overview

All SQL in this project follows a strict vertical formatting style: every top-level keyword on its own line, everything beneath it indented.

**No exceptions for short queries.** A one-column, one-table, one-condition query gets the same formatting as a 10-join monster.

## Rules

### Keyword Casing

All SQL keywords UPPERCASE: `SELECT`, `FROM`, `WHERE`, `JOIN`, `ON`, `AND`, `OR`, `INSERT INTO`, `VALUES`, `UPDATE`, `SET`, `DELETE FROM`, `ORDER BY`, `GROUP BY`, `HAVING`, `LIMIT`, `AS`, `ON DUPLICATE KEY UPDATE`, `CREATE TABLE`, `ALTER TABLE`, `DEFAULT`, `NOT NULL`, `PRIMARY KEY`, `AUTO_INCREMENT`, `ENGINE`, `CHARSET`, `COLLATE`, `INDEX`, `UNIQUE KEY`.

### Vertical Layout

Every top-level clause keyword sits **alone on its own line, flush left**. Everything belonging to that clause is indented one level (4 spaces) below it.

Top-level clause keywords: `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `GROUP BY`, `HAVING`, `LIMIT`, `SET`, `VALUES`, `ON DUPLICATE KEY UPDATE`.

### SQL in String Literals (PHP)

When SQL is inside a quoted string, put the opening and closing quotes on their own lines. Start the SQL on the next line, indented one level from the quote. The closing quote sits at the same indent as the opening quote:

```php
$stmt = $this->pdo->prepare(
    '
        SELECT
            a.name,
            s.common_name
        FROM
            animals a
            JOIN species s
                ON a.species_id = s.id
        WHERE
            a.tag_id = :tag_id
    '
);
```

The SQL's "flush left" is one indent level in from the quote. Top-level clause keywords align there, and their contents indent one more level (4 spaces) from there.

### Columns

One column per line, indented, trailing commas:

```sql
SELECT
    a.name,
    a.weight_kg,
    a.birth_date
```

### FROM and JOINs

JOINs are indented under `FROM`. `ON` is indented under the JOIN:

```sql
FROM
    animals a
    JOIN species s
        ON a.species_id = s.id
    JOIN habitats h
        ON a.habitat_id = h.id
```

### WHERE

First condition indented. Continuation lines at the same indent with `AND`/`OR` leading:

```sql
WHERE
    s.class = :class
    AND h.region = :region
    AND a.released_at IS NULL
```

### ORDER BY / GROUP BY

```sql
ORDER BY
    a.name ASC
GROUP BY
    s.id,
    h.name
```

### INSERT

```sql
INSERT INTO sightings (
    animal_id,
    location,
    observed_at
)
VALUES (
    :animal_id,
    :location,
    :observed_at
)
ON DUPLICATE KEY UPDATE
    location = new.location,
    observed_at = new.observed_at
```

### UPDATE

```sql
UPDATE
    animals
SET
    habitat_id = :habitat_id
WHERE
    id = :id
```

### DELETE

```sql
DELETE FROM
    sightings
WHERE
    animal_id = :animal_id
    AND observed_at = :observed_at
```

### CREATE TABLE (migrations)

```sql
CREATE TABLE animals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    species_id BIGINT UNSIGNED NOT NULL,
    habitat_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) DEFAULT NULL,
    weight_kg DECIMAL(10, 2) DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_species_id (species_id),
    INDEX idx_habitat_id (habitat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Quick Reference

| Element | Rule |
|---|---|
| Keywords | Always UPPERCASE |
| Top-level clauses | Own line, flush left |
| Clause contents | Indented 4 spaces |
| Columns | One per line, trailing comma |
| JOINs | Indented under FROM |
| ON conditions | Indented under JOIN |
| AND/OR | Leads the continuation line, same indent as first condition |
| Short queries | Same rules, no exceptions |

## Common Mistakes

- Putting `FROM tablename` on one line instead of `FROM` alone then table indented
- Listing multiple columns on one line
- Leaving JOINs flush left instead of indented under FROM
- Inlining short queries as one-liners
