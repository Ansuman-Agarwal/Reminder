import z from "zod";
import { publicProcedure, router } from "../context.trpc";
import { db } from "../db/db.config";

export const botReminderController = router({
  addReminder: publicProcedure
    .input(
      z.object({
        isReminder: z.any(),
        reminderTitle: z.string().optional(),
        reminderDescription: z.string().optional(),
        reminderDateTime: z.string().optional(),
        timeZone: z.string().optional(),
        whatsappNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(input);

      if (!input.isReminder) {
        return {
          success: false,
          message: "Please select a reminder type",
        };
      }

      const userId = await db.user
        .findBy({
          whatsappNumber: input.whatsappNumber,
        })
        .select("id");

      if (!userId?.id) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const reminder = await db.reminder.create({
        title: input.reminderTitle ?? "Reminder from Reminder App",
        timezone: input.timeZone ?? "Asia/Kolkata",
        userId: userId.id,
        dateTime: input.reminderDateTime!,
        description: input.reminderDescription,
      });
      console.log(reminder);
      return reminder;
    }),
});
