import { defineHandler, HTTPError } from "nitro";
import { neon } from "@neondatabase/serverless";

export default defineHandler(async (event) => {
  const sql = neon(process.env.DATABASE_URL);

  const body = await event.req.json();

  const personId = Number(body.personId);
  const leaveType = String(body.leaveType || "").trim();
  const startDate = String(body.startDate || "");
  const endDate = String(body.endDate || "");

  const comment = String(body.comment || "").trim();
  const halfDay = body.halfDay === true;

  if (
    !personId ||
    !leaveType ||
    !startDate ||
    !endDate
  ) {
    throw new HTTPError(
      "Missing leave information.",
      { status: 400 }
    );
  }

  if (endDate < startDate) {
    throw new HTTPError(
      "End date cannot be before start date.",
      { status: 400 }
    );
  }

  if (halfDay && startDate !== endDate) {
    throw new HTTPError(
      "Half-day leave can only be added for one date.",
      { status: 400 }
    );
  }

  const members = await sql`
    SELECT team_group
    FROM team_members
    WHERE id = ${personId}
  `;

  if (!members.length) {
    throw new HTTPError(
      "Team member not found.",
      { status: 404 }
    );
  }

  const teamGroup = members[0].team_group;

  if (teamGroup !== 0) {
    const conflicts = await sql`
      SELECT
        COUNT(DISTINCT lr.person_id)::int AS away
      FROM leave_records lr
      JOIN team_members tm
        ON tm.id = lr.person_id
      WHERE tm.team_group = ${teamGroup}
        AND lr.person_id <> ${personId}
        AND lr.start_date <= ${endDate}
        AND lr.end_date >= ${startDate}
    `;

    if (conflicts[0].away >= 2) {
      throw new HTTPError(
        `Group ${teamGroup} already has two team members on leave during these dates.`,
        { status: 409 }
      );
    }
  }

  const created = await sql`
    INSERT INTO leave_records (
      person_id,
      leave_type,
      start_date,
      end_date,
      comment,
      half_day
    )
    VALUES (
      ${personId},
      ${leaveType},
      ${startDate},
      ${endDate},
      ${comment},
      ${halfDay}
    )
    RETURNING
      id,
      person_id,
      leave_type,
      start_date::text,
      end_date::text,
      comment,
      half_day,
      created_at
  `;

  return created[0];
});
