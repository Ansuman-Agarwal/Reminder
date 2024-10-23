import { inferRouterOutputs } from "@trpc/server";
// import * as packageJson from "../package.json";
import { publicProcedure, router } from "./context.trpc";
import { authApi } from "./auth/auth-api";
import { reminderController } from "./controllers/reminder.controller";
import { userController } from "./controllers/user.controller";
import { botReminderController } from "./controllers/botReminder.controller";

export const trpcRouter = router({
  botReminderController: botReminderController.addReminder,
  user: userController,
  auth: authApi,
  version: publicProcedure.query(() => ({
    // beVersion: packageJson.version,
    // forceLogoutBelowFrontendVersion:
    // packageJson.force_logout_below_frontend_version,
    // forceUpdateBelowFrontendVersion:
    // packageJson.force_update_below_frontend_version,
  })),
  reminder: reminderController,
  verifyWhatsappStatus: userController.receiveVarificationPollResponse,
});

// export type definition of API
export type ApiRouter = typeof trpcRouter;
export type RouterOutputs = inferRouterOutputs<ApiRouter>;
