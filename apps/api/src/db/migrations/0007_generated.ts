import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('user', (t) => ({
    preferedTimezone: t.add(t.string().nullable()),
  }));
});
