"use strict";

const fs = require("fs-extra");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
const isCloudinary = (u) =>
  typeof u === "string" && u.includes("res.cloudinary.com");

// Download a URL into public/uploads/<name>. Uses global fetch (Node 18+).
async function downloadTo(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
}

async function migrate(app) {
  await fs.ensureDir(UPLOAD_DIR);

  // Fetch all upload file records (paginated).
  const files = [];
  const pageSize = 200;
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await app.db
      .query("plugin::upload.file")
      .findMany({ limit: pageSize, offset });
    files.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  app.log.info(`[migrate] ${files.length} file record(s) found`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    if (!isCloudinary(file.url)) {
      skipped++;
      continue;
    }

    try {
      // Main file → /uploads/<hash><ext>
      const mainName = `${file.hash}${file.ext}`;
      await downloadTo(file.url, mainName);
      const newUrl = `/uploads/${mainName}`;

      // Responsive formats (thumbnail/small/medium/large), each its own file.
      let newFormats = file.formats
        ? JSON.parse(JSON.stringify(file.formats))
        : file.formats;

      if (newFormats && typeof newFormats === "object") {
        for (const key of Object.keys(newFormats)) {
          const fmt = newFormats[key];
          if (fmt && isCloudinary(fmt.url)) {
            const fname = `${fmt.hash}${fmt.ext}`;
            await downloadTo(fmt.url, fname);
            fmt.url = `/uploads/${fname}`;
            fmt.provider_metadata = null;
          }
        }
      }

      await app.db.query("plugin::upload.file").update({
        where: { id: file.id },
        data: {
          url: newUrl,
          formats: newFormats,
          provider: "local",
          provider_metadata: null,
        },
      });

      migrated++;
      app.log.info(`[migrate] ${file.name} → ${newUrl}`);
    } catch (err) {
      failed++;
      app.log.error(
        //@ts-ignore
        `[migrate] FAILED "${file.name}" (id ${file.id}): ${err.message}`,
      );
    }
  }

  app.log.info(
    `[migrate] DONE — migrated: ${migrated}, skipped (already local): ${skipped}, failed: ${failed}`,
  );
  if (failed > 0) {
    app.log.warn(
      "[migrate] Some files failed — re-run the script; it will retry only the ones still on Cloudinary.",
    );
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require("@strapi/strapi");

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = "info";

  try {
    await migrate(app);
  } finally {
    await app.destroy();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
