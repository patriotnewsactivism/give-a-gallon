import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "daily-creator-payouts",
  "0 0 * * *",
  internal.paypalPayouts.runWeeklyPayouts,
);

export default crons;
