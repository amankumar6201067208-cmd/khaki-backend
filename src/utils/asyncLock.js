"use strict";

const locks = new Map();

/**
 * Run `task` while holding the lock for `key`. Concurrent calls with the same
 * key run one-at-a-time, in arrival order. Different keys run in parallel.
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
async function runWithLock(key, task) {
  // Chain this task onto whatever is currently queued for this key.
  const previous = locks.get(key) || Promise.resolve();

  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });

  // The new tail of the queue is "previous finished, then this one finishes".
  locks.set(
    key,
    previous.then(() => current),
  );

  // Wait for our turn.
  await previous;

  try {
    return await task();
  } finally {
    // @ts-ignore
    release();
    // Clean up the map if no one else queued behind us.
    if (locks.get(key) === previous.then(() => current)) {
      // (Best-effort cleanup; safe to skip if a newer task already chained on.)
    }
    // Prevent unbounded growth: if the current tail resolved, drop the entry.
    Promise.resolve().then(() => {
      const tail = locks.get(key);
      if (!tail) return;
      tail.then(() => {
        if (locks.get(key) === tail) locks.delete(key);
      });
    });
  }
}

module.exports = { runWithLock };
