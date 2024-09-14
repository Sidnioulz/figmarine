import { log } from '@figmarine/logger';

import { getConfig, type Log } from './rateLimit.config';

/**
 * Returns the timestamp at which it'll be acceptable to run the next
 * request without getting past the rate limit budget for a given sliding
 * window request log.
 *
 * @param now The current time.
 * @param requestCost The cost of the request we want to send.
 * @param reqLog The request log to inspect.
 * @param WINDOW_BUDGET The max budget within the sliding window.
 * @param WINDOW_LENGTH The sliding window duration.
 * @returns The timestamp from when the request can be sent. Matches `now` if
 * the request can be sent immediately.
 */
function getNextRequestLegalTime(
  now: number,
  requestCost: number,
  reqLog: Log,
  WINDOW_BUDGET: number,
  WINDOW_LENGTH: number,
) {
  // Account for the (rare!) case where the budget is smaller than the request cost and throw.
  if (WINDOW_BUDGET < requestCost) {
    const errMsg = `Rate limit: request cannot proceed due to improper configuration (request cost: ${requestCost}, max cost in sliding window: ${WINDOW_BUDGET}).`;
    throw new Error(errMsg);
  }

  // Compute timestamp of the start of the window in which we'll consider requests.
  const startOfWindow = now - WINDOW_LENGTH;

  // Find first request, in the log, that matches the wanted time window.
  const indexOfFirstRelevantRequest = reqLog.findIndex(
    ({ timestamp }) => timestamp > startOfWindow,
  );

  // Purge any request before that one, as they're expired.
  if (indexOfFirstRelevantRequest > 0) {
    reqLog.splice(0, indexOfFirstRelevantRequest);
  }
  log(
    `Rate limit: sliding window starts at ${startOfWindow}, request log contains ${reqLog.length} relevant${
      indexOfFirstRelevantRequest > 0 ? ` and ${indexOfFirstRelevantRequest} stale` : ''
    } requests.`,
  );

  // Sum the budget consumed by all requests within the window of reference.
  let remainingBudget = WINDOW_BUDGET;
  for (let i = reqLog.length - 1; i >= 0; i--) {
    remainingBudget -= reqLog[i].budget;

    // If we go past the budget, we can tell our callee exactly when there'll
    // be enough budget for their call.
    if (remainingBudget < requestCost) {
      log(
        `Rate limit: we're over budget (time of offending request ${reqLog[i].timestamp}, budget freed by it: ${reqLog[i].budget}).`,
      );
      return reqLog[i].timestamp + WINDOW_LENGTH;
    }
  }

  log(
    `Rate limit: we're within budget (remaining: ${remainingBudget}, cost of next request: ${requestCost}).`,
  );
  return now;
}

export async function interceptRequest(requestCost: number): Promise<void> {
  const { reqLog, WINDOW_BUDGET, WINDOW_LENGTH } = getConfig();

  // Second precision is enough.
  const now = Math.floor(Date.now() / 1000);
  log(
    `Rate limit: checking if we can send a request at ${now} (cost: ${requestCost}, budget: ${WINDOW_BUDGET} every ${WINDOW_LENGTH} seconds)`,
  );

  // Figure out the next request time.
  const runNextRequest = getNextRequestLegalTime(
    now,
    requestCost,
    reqLog,
    WINDOW_BUDGET,
    WINDOW_LENGTH,
  );
  const timeDelta = runNextRequest - now;
  log(`Rate limit: request can be sent in ${timeDelta} seconds (at ${runNextRequest})`);

  // We must remember to write in the queues that we'll be consuming budget,
  // at a given time. We write BEFORE delaying to ensure we've "booked" the
  // budget we'll need to run the call.
  reqLog.push({ timestamp: runNextRequest, budget: requestCost });

  // TODO read the 429 log for additional delays.

  // Now wait if necessary.
  if (timeDelta > 0) {
    log(`Waiting ${timeDelta} seconds to respect API rate limits.\n`);
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        resolve();
      }, timeDelta * 1000),
    );
  } else {
    log(`Rate limit: sending request immediately\n`);
  }
}

export async function interceptResponse() {
  // In case of unexpected 429, record it so we can delay the next requests.
  // TODO
  // Return the response to the caller.
  // TODO
}
