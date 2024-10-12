import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('reminder', (t) => ({
    description: t.change(t.varchar(255), t.string().nullable()),
  }));
});
