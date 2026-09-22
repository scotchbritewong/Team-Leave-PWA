import { defineHandler, HTTPError } from "nitro";
import { neon } from "@neondatabase/serverless";

export default defineHandler(async (event) => {
  const sql = neon(process.env.DATABASE_URL);

  const id = Number(
    event.url.searchParams.get("id")
  );

  if (!id) {
    throw new HTTPError(
      "Leave ID is required.",
      { status: 400 }
    );
  }

  const deleted = await sql`
    DELETE FROM leave_records
    WHERE id = ${id}
    RETURNING id
  `;

  if (!deleted.length) {
    throw new HTTPError(
      "Leave record not found.",
      { status: 404 }
    );
  }

  return {
    success: true,
    id: deleted[0].id
  };
});
