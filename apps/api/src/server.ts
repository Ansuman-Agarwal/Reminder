import { fastifyCors } from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { app } from "./app";
import { env } from "./configs/env.config";
import schedule from "node-schedule";
import { db } from "./db/db.config";
import { scheduleJob } from "node-schedule";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { isBefore } from "date-fns";
import { sendNotification } from "./services/whatsapp.service";

export const server = app;

const port = Number(process.env.PORT) || 3000;

// TODO: Figure out how to get secure-session https://www.npmjs.com/package/@fastify/secure-session
server
  .register(fastifyCors, {
    origin: [env.FRONTEND_URL as string],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true,
  })
  .register(helmet)
  .register(sensible);

const job = schedule.scheduleJob("* * * * *", async function () {
  try {
    const serverNow = new Date();
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Fetch pending reminders
    let pendingReminders = [];
    try {
      pendingReminders = await db.reminder
        .selectAll()
        .where({ status: "pending" });
    } catch (dbError) {
      server.log.error("Failed to fetch pending reminders:", dbError);
      return; // Exit the function but don't crash the server
    }

    const remindersToSend = [];
    for (const reminder of pendingReminders) {
      try {
        const reminderDate = toDate(reminder.dateTime, {
          timeZone: reminder.timezone,
        });
        const reminderServerDate = toDate(
          formatInTimeZone(
            reminderDate,
            serverTimezone,
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          )
        );

        if (isBefore(reminderServerDate, serverNow)) {
          // Fetch user's WhatsApp number
          const user = await db.user.findBy({ id: reminder.userId });

          if (user && user.whatsappNumber) {
            remindersToSend.push({
              reminderId: reminder.id,
              whatsappNumber: user.whatsappNumber,
              title: reminder.title,
              description: reminder.description || "",
            });
          }
        }
      } catch (reminderError) {
        // Log error for this specific reminder but continue processing others
        server.log.error(
          `Error processing reminder ${reminder.id}:`,
          reminderError
        );
        continue;
      }
    }

    if (remindersToSend.length > 0) {
      try {
        console.log("************ This reminder is ready to send ************");
        await sendNotification(remindersToSend);
        console.log(remindersToSend);
      } catch (notificationError) {
        server.log.error("Failed to send notifications:", notificationError);
        // You might want to implement a retry mechanism here
      }
    } else {
      console.log(
        "************** There are no reminders to send ***************"
      );
    }

    server.log.info("Jay is a good boy");
  } catch (error) {
    // Catch any unexpected errors at the top level
    server.log.error("Critical error in reminder job:", error);
    // You might want to notify admins here for critical errors
  }
});

// Error handler for the scheduled job itself
job.on("error", (error) => {
  server.log.error("Scheduler error:", error);
});

// Run the server!
server.listen({ port: port, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }

  server.log.info(`Server is now listening on ${address}`);
});

const unexpectedErrorHandler = (error: unknown) => {
  console.error(error);
  server.close();
  process.exit(1);
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
