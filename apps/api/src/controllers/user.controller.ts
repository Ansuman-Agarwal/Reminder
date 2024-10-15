import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../context.trpc";
import { db } from "../db/db.config";
import axios from "axios";

export const userController = router({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    console.log("userId", userId);

    const currUser = await db.user.findBy({ id: userId });
    console.log("currUser", currUser);
    return currUser;
  }),
  updateUser: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        name: z.string(),
        preferedTimezone: z.string(),
        whatsappNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      console.log("userId", userId);

      await db.user.where({ id: userId }).update(input);
      const currUser = await db.user.findBy({ id: userId });

      console.log("currUser", currUser);
      return currUser;
    }),
  sendWhatsappVerificationCode: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    console.log("userId", userId);

    const currUser = await db.user.findBy({ id: userId });
    if (currUser.isWhatsappVerified) {
      return currUser;
    }
    const loginPollResponseData = await axios.post(
      "http://localhost:8080/send-login-poll",
      {
        whatsappNumber: currUser.whatsappNumber,
      }
    );
    if (loginPollResponseData.data.success) {
      return "Login Poll sent successfully to the user's whatsapp number";
    } else {
      throw new Error("Login Poll failed to send please try again");
    }
  }),
  receiveVarificationPollResponse: publicProcedure
    .input(z.object({ userPhoneNumber: z.string(), messageBody: z.string() }))
    .mutation(async ({ input }) => {
      const currUser = await db.user.findBy({
        whatsappNumber: input.userPhoneNumber,
      });
      if (currUser.isWhatsappVerified) {
        return currUser;
      }
      const updatedUser = await db.user
        .where({ whatsappNumber: input.userPhoneNumber })
        .update({
          isWhatsappVerified: true,
        });
      return updatedUser;
    }),
});
