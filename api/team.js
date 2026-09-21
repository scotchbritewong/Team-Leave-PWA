import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const leave = await sql`
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

      return response.status(200).json(leave);
    }

    if (request.method === "POST") {
      const {
        personId,
        leaveType,
        startDate,
        endDate
      } = request.body;

      if (
        !personId ||
        !leaveType ||
        !startDate ||
        !endDate
      ) {
        return response.status(400).json({
          error: "Missing leave information."
        });
      }

      if (endDate < startDate) {
        return response.status(400).json({
          error: "End date cannot be before start date."
        });
      }

      const member = await sql`
        SELECT team_group
        FROM team_members
        WHERE id = ${Number(personId)}
      `;

      if (!member.length) {
        return response.status(404).json({
          error: "Team member not found."
        });
      }

      const group = member[0].team_group;

      if (group !== 0) {
        const conflict = await sql`
          SELECT COUNT(DISTINCT lr.person_id)::int AS away
          FROM leave_records lr
          JOIN team_members tm
            ON tm.id = lr.person_id
          WHERE tm.team_group = ${group}
            AND lr.person_id <> ${Number(personId)}
            AND lr.start_date <= ${endDate}
            AND lr.end_date >= ${startDate}
        `;

        if (conflict[0].away >= 2) {
          return response.status(409).json({
            error:
              `Group ${group} already has two team members on leave during these dates.`
          });
        }
      }

      const created = await sql`
        INSERT INTO leave_records (
          person_id,
          leave_type,
          start_date,
          end_date
        )
        VALUES (
          ${Number(personId)},
          ${leaveType},
          ${startDate},
          ${endDate}
        )
        RETURNING
          id,
          person_id,
          leave_type,
          start_date::text,
          end_date::text,
          created_at
      `;

      return response.status(201).json(created[0]);
    }

    if (request.method === "DELETE") {
      const { id } = request.query;

      if (!id) {
        return response.status(400).json({
          error: "Leave ID is required."
        });
      }

      await sql`
        DELETE FROM leave_records
        WHERE id = ${Number(id)}
      `;

      return response.status(200).json({
        success: true
      });
    }

    response.setHeader(
      "Allow",
      ["GET", "POST", "DELETE"]
    );

    return response.status(405).json({
      error: "Method not allowed."
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: "Database error."
    });
  }
}
