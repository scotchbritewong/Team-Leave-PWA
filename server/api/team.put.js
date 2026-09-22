import { defineHandler, HTTPError } from "nitro";
import { neon } from "@neondatabase/serverless";

export default defineHandler(async (event) => {
  const sql = neon(process.env.DATABASE_URL);

  const body = await event.req.json();

  const id = Number(body.id);
  const name = String(body.name || "").trim();

  if (!id || !name) {
    throw new HTTPError(
      "Member ID and name are required.",
      { status: 400 }
    );
  }

  const result = await sql`
    UPDATE team_members
    SET name = ${name}
    WHERE id = ${id}
    RETURNING
      id,
      name,
      team_group
  `;

  if (!result.length) {
    throw new HTTPError(
      "Team member not found.",
      { status: 404 }
    );
  }

  return result[0];
});
