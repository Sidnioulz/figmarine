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
 * Single event queue for number of requests in the last minute.
 * TODO: ensure these logs are disk-cached and well restored across client runs.
 */
const reqLog: Log = [];

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

/**
 * Returns singleton objects and constants for the exponential delay algorithm on 429 errors.
 * Exposed this way for mockability in tests.
 * @returns 429 retry algorithm config data
 */
export function get429Config() {
  return {
    // We want a one second initial delay, but axios-retry uses 2^count, so 2^1 * 500 = 1000ms for the initial retry.
    INITIAL_DELAY: 500,
  };
}
