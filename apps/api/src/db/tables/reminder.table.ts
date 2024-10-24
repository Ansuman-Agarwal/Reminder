import { Queryable, Selectable, Updatable } from "orchid-orm";
import { BaseTable } from "./baseTable";
import { UserTable } from "./user.table";

export class ReminderTable extends BaseTable {
  readonly table = "reminder";
  columns = this.setColumns((t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(t.sql`gen_random_uuid()`),
    title: t.string(),
    description: t.string().nullable(),
    timezone: t.string(),
    dateTime: t.string(),
    status: t
      .enum("status", ["pending", "completed", "failed"])
      .default("pending"),
    userId: t.uuid().foreignKey(() => UserTable, "id"),
    createdAt: t.timestamps().createdAt,
    updatedAt: t.timestamps().updatedAt,
  }));

  relations = {
    user: this.belongsTo(() => UserTable, {
      required: true,
      columns: ["userId"],
      references: ["id"],
    }),
  };
}

export type Reminder = Selectable<ReminderTable>;
export type ReminderUpdate = Updatable<ReminderTable>;
export type ReminderForQuery = Queryable<ReminderTable>;
