import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('reminder', (t) => ({
    ...t.drop(
      t.unique(['user_id'])
    ),
  }));
});
