/*
 * Rate limits for the REST API are unknown, and Figma has declined to communicate
 * on them. We suspect bursts are tolerated, and some folks say 10 requests per
 * minute are the most that can be sent. The only official advice is to wait one
 * minute after a 429.
 */
const WINDOW_BUDGET = 10;
const WINDOW_LENGTH = 60;
const ERROR_WAIT_DURATION = 60;
const RATE_DECREASE_LENGTH = 900;

type LogEntry = {
  timestamp: number;
  budget: number;
};

export type Log = LogEntry[];

/*
 * Single event queue for number of requests in the last minute. Note that the Plugin API
 * rate limit seems to use two sliding windows: one per minute and one per day.
 * TODO: find a good storage place for these.
 * TODO: ensure these logs are disk-cached and well restored across client runs.
 */
const reqLog: Log = [];

/**
 * Log of previous Error 429 events. When we get a 429, we apply a multiplier to our budget
 * calculations to slow future requests down for a while, in an attempt to limit the risk
 * of further 429 errors.
 */
// TODO: implement
// const error429Log: Log = [];

/**
 * Returns singleton objects and constants for the rate limit algorithm.
 * Exposed this way for mockability in tests.
 * @returns Rate limit config data
 */
export function getConfig() {
  return {
    reqLog,
    WINDOW_BUDGET,
    WINDOW_LENGTH,
    ERROR_WAIT_DURATION,
    RATE_DECREASE_LENGTH,
  };
}
