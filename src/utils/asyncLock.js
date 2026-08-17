"use strict";

const locks = new Map();

/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
async function runWithLock(key, task) {
  const previous = locks.get(key) || Promise.resolve();

  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });

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
    if (locks.get(key) === previous.then(() => current)) {
    }
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
