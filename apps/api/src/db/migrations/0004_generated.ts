import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('reminder', (t) => ({
    ...t.add(
      t.unique(['userId'])
    ),
  }));
});
