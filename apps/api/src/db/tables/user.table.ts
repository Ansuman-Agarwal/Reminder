import { Queryable, Selectable, Updatable } from "orchid-orm";
import { BaseTable } from "./baseTable";
import { ReminderTable } from "./reminder.table";

export class UserTable extends BaseTable {
  readonly table = "user";
  columns = this.setColumns((t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(t.sql`gen_random_uuid()`),
    name: t.string().trim(),
    email: t.string().trim().unique(),
    isVerified: t.boolean().default(false),
    profilePicture: t.string().nullable(),
    preferedTimezone: t.string().nullable(),
    isWhatsappVerified: t.boolean().default(false),
    whatsappNumber: t.string().nullable().unique(),
    lastLoginAt: t.timestamp().nullable(),
    createdAt: t.timestamps().createdAt.nullable(),
    updatedAt: t.timestamps().updatedAt.nullable(),
  }));

  relations = {
    reminders: this.hasMany(() => ReminderTable, {
      columns: ["id"],
      references: ["userId"],
    }),
  };
}

export type User = Selectable<UserTable>;
export type UserUpdate = Updatable<UserTable>;
export type UserForQuery = Queryable<UserTable>;
