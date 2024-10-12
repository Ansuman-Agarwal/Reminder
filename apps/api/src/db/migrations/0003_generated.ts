import { change } from '../dbScript';

change(async (db) => {
  await db.createTable('reminder', (t) => ({
    id: t.uuid().primaryKey().default(t.sql`gen_random_uuid()`),
    title: t.string(),
    description: t.string(),
    timezone: t.string(),
    dateTime: t.string(),
    userId: t.uuid().foreignKey('user', 'id'),
    createdAt: t.timestamps().createdAt.nullable(),
    updatedAt: t.timestamps().updatedAt.nullable(),
  }));
});
