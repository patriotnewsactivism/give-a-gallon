import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "weekly-creator-payouts",
  "0 5 * * 5",
  internal.paypalPayouts.runWeeklyPayouts,
);

export default crons;
