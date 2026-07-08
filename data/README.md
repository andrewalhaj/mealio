# SQLite Database

The SQLite database files (`mealio.db` and any backup files) are generated locally by Prisma and are **not committed** to the repository.

When you run the application locally, Prisma will create the database automatically in this directory. Each developer or deployment environment generates its own database.

To initialize a fresh database:

```bash
npx prisma db push
npx prisma db seed    # optional: populate sample data
```

See `prisma/schema.prisma` for the database schema and `DATABASE_URL` in `.env` for the connection string.
