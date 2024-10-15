import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('reminder', (t) => ({
    createdAt: t.change(t.timestamp().nullable().default(t.sql`now()`), t.timestamps().createdAt),
    updatedAt: t.change(t.timestamp().nullable().default(t.sql`now()`), t.timestamps().updatedAt),
  }));

  await db.changeTable('user', (t) => ({
    ...t.add(
      t.unique(['whatsappNumber'])
    ),
  }));
});
