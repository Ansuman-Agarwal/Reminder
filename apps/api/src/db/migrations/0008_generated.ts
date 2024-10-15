import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('user', (t) => ({
    isWhatsappVerified: t.add(t.boolean().default(false)),
  }));
});
