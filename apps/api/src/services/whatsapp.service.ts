import axios from "axios";
import { db } from "../db/db.config";
import z from "zod";

export const reminderResponseSchema = z.array(
  z.object({
    success: z.boolean(),
    message: z.string(),
    reminderId: z.string(),
  })
);

export type reminderResponseType = z.infer<typeof reminderResponseSchema>;

const reminderInputArray = z.array(
  z.object({
    reminderId: z.string(),
    whatsappNumber: z.string(),
    title: z.string(),
    description: z.string(),
  })
);

export async function sendNotification(
  reminderInput: z.infer<typeof reminderInputArray>
) {
  try {
    console.log("sending reminder", reminderInput);

    const { data }: { data: reminderResponseType } = await axios.post(
      "http://localhost:8080/send-reminder",
      {
        reminderInput,
      }
    );
    data.forEach(async (reminder) => {
      if (reminder.success) {
        await db.reminder.where({ id: reminder.reminderId }).update({
          status: "completed",
        });
      } else {
        await db.reminder.where({ id: reminder.reminderId }).update({
          status: "failed",
        });
      }
    });
  } catch (error) {
    console.error("Error sending notifications");
    console.error(error);
    throw new Error("Error sending notifications");
  }
}
