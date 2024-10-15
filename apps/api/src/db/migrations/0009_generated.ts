import { change } from '../dbScript';

change(async (db) => {
  await db.createEnum('public.status', ['pending', 'completed']);
});

change(async (db) => {
  await db.changeTable('reminder', (t) => ({
    status: t.add(t.enum('status').default('pending')),
  }));
});
