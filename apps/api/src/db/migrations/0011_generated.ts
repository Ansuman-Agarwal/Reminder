import { change } from '../dbScript';

change(async (db) => {
  await db.addEnumValues('public.status', ['failed']);
});
