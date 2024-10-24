import { orchidORM } from "orchid-orm";
import { env, isTest } from "../configs/env.config";
import { UserTable } from "./tables/user.table";
import { ReminderTable } from "./tables/reminder.table";

export const db = orchidORM(
  {
    // biome-ignore lint/style/useNamingConvention: <as needed by library>
    databaseURL: isTest ? (env.DB_TEST_URL as string) : (env.DB_URL as string),
    max: 100,
    min: 10,
  },
  {
    user: UserTable,
    reminder: ReminderTable,
  }
);
