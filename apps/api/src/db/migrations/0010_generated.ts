import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('user', (t) => ({
    whatsappNumber: t.add(t.string().nullable()),
  }));
});
