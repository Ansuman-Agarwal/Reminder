import z from "zod";
import { protectedProcedure, router } from "../context.trpc";
import { db } from "../db/db.config";

export const reminderController = router({
  getAllReminder: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const allReminder = await db.reminder.selectAll().where({ userId });

    return allReminder;
  }),

  addReminder: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().nullable(),
        timezone: z.string().min(1, "Timezone is required"),
        dateTime: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const reminder = await db.reminder.create({
        title: input.title,
        timezone: input.timezone,
        userId: userId,
        dateTime: input.dateTime,
        description: input.description,
      });
      return reminder;
    }),

  updaeReminder: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, "Id is required"),
        title: z.string().min(1, "Title is required"),
        description: z.string().nullable(),
        timezone: z.string().min(1, "Timezone is required"),
        dateTime: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const reminder = await db.reminder
        .where({ id: input.id })
        .update({
          title: input.title,
          timezone: input.timezone,
          userId: userId,
          dateTime: input.dateTime,
          description: input.description,
        })
        .where({ id: input.id });
      return reminder;
    }),

  deleteReminder: protectedProcedure
    .input(z.object({ id: z.string().min(1, "Id is required") }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const reminder = await db.reminder.where({ id: input.id }).delete();
      return reminder;
    }),
});
