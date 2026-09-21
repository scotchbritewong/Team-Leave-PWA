import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
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

      return response.status(200).json(records);
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
      const id = request.query.id;

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
