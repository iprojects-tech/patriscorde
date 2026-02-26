# PostgreSQL Setup (Atelier)

Este folder trae la migracion de BD para PostgreSQL puro:

- `01_schema_postgres.sql`: estructura, constraints, indices, funciones y triggers de `public`.
- `02_seed_postgres.sql`: datos exportados de `public`.
- `03_auth_hardening.sql`: columnas `password_hash` y `password_updated_at` para `customers` y `admin_users`.

## 1) Crear base de datos

```sql
CREATE DATABASE atelier;
```

## 2) Ejecutar schema

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/atelier" -f postgres/01_schema_postgres.sql
```

## 3) Ejecutar seed

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/atelier" -f postgres/02_seed_postgres.sql
```

## 4) Verificar tablas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Debe listar: `admin_users`, `categories`, `customers`, `order_items`, `orders`, `products`, `saved_carts`.

## 5) Hardening de autenticacion

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/atelier" -f postgres/03_auth_hardening.sql
```

## Nota sobre tu punto 4 (snippet sin resultados)

Si un snippet de introspeccion no regresa filas, normalmente es porque:

- se corrio en otra BD/proyecto,
- o no existian objetos de ese tipo (por ejemplo triggers/policies custom),
- o el filtro de schema no era `public`.

Con los CSV que compartiste ya quedo cubierta la extraccion de policies/columnas sensibles para documentar la migracion.
