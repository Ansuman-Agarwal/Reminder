import z from "zod";
import { protectedProcedure, router } from "../context.trpc";
import { db } from "../db/db.config";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { parseISO } from "date-fns";
import { scheduleJob } from "node-schedule";
import axios from "axios";

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
      console.log(input);
      const userId = ctx.user.id;
      const reminder = await db.reminder.create({
        title: input.title,
        timezone: input.timezone,
        userId: userId,
        dateTime: input.dateTime,
        description: input.description,
      });

      const userWhatsappNumbre = await db.user
        .select("whatsappNumber")
        .where({ id: userId });

      // Convert the input dateTime to a Date object in the server's local time
      const scheduledDate = toDate(parseISO(input.dateTime));

      // Format the date in the user's timezone
      const formattedDate = formatInTimeZone(
        scheduledDate,
        input.timezone,
        "yyyy-MM-dd'T'HH:mm:ssXXX"
      );

      scheduleJob(formattedDate, async () => {
        console.log(`Executing reminder: ${reminder.title}`);
        await sendNotification(
          reminder.id,
          userWhatsappNumbre[0]?.whatsappNumber!,
          reminder.title,
          reminder.description ?? ""
        );
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

async function sendNotification(
  reminderId: string,
  whatsappNumber: string,
  title: string,
  description: string
) {
  console.log(
    `Sending notification to user ${whatsappNumber}: ${title} \n\n\n  ${description}`
  );
  await axios
    .post("http://localhost:8080/send-reminder", {
      reminderId: reminderId,
      whatsappNumber: whatsappNumber,
      messageBody: `**${title}**  \n\n ${description}`,
    })
    .then(async (res) => {
      if (res.data.success) {
        await db.reminder.where({ id: res.data.reminderId }).update({
          status: "completed",
        });
      } else {
        await db.reminder.where({ id: res.data.reminderId }).update({
          status: "failed",
        });
      }
    });
}
