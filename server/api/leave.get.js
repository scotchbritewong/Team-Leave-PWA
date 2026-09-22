import { defineHandler } from "nitro";
import { neon } from "@neondatabase/serverless";

export default defineHandler(async () => {
  const sql = neon(process.env.DATABASE_URL);

  const records = await sql`
    SELECT
      id,
      person_id,
      leave_type,
      start_date::text,
      end_date::text,
      created_at
    FROM leave_records
    ORDER BY start_date, id
  `;

  return records;
});
``
