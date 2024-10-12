import { change } from '../dbScript';

change(async (db) => {
  await db.changeTable('user', (t) => ({
    name: t.change(t.varchar(255).nullable(), t.string()),
    email: t.change(t.varchar(255).nullable(), t.string()),
  }));
});
