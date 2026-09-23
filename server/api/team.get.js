import { defineHandler } from "nitro";
import { neon } from "@neondatabase/serverless";

export default defineHandler(async () => {
  const sql = neon(process.env.DATABASE_URL);

  const records = await sql`
    SELECT
      id,
      name,
      team_group
    FROM team_members
    ORDER BY
      team_group,
      id
  `;

  return records;
});
``
