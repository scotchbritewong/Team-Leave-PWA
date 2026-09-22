import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import { createRoot } from "react-dom/client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Timer,
  UserRound,
  Users,
  X
} from "lucide-react";

import "./style.css";

/* =========================================================
   SINGAPORE PUBLIC HOLIDAYS
   ========================================================= */

const holidays = {
  /* 2026 */

  "2026-01-01": "New Year's Day",

  "2026-02-17": "Chinese New Year",
  "2026-02-18": "Chinese New Year",

  "2026-03-21": "Hari Raya Puasa",

  "2026-04-03": "Good Friday",

  "2026-05-01": "Labour Day",

  "2026-05-27": "Hari Raya Haji",

  "2026-05-31": "Vesak Day",
  "2026-06-01": "Vesak Day (Observed)",

  "2026-08-09": "National Day",
  "2026-08-10": "National Day (Observed)",

  "2026-11-08": "Deepavali",
  "2026-11-09": "Deepavali (Observed)",

  "2026-12-25": "Christmas Day",

  /* 2027 */

  "2027-01-01": "New Year's Day",

  "2027-02-06": "Chinese New Year",
  "2027-02-07": "Chinese New Year",
  "2027-02-08": "Chinese New Year (Observed)",

  "2027-03-10": "Hari Raya Puasa",

  "2027-03-26": "Good Friday",

  "2027-05-01": "Labour Day",

  "2027-05-17": "Hari Raya Haji",

  "2027-05-20": "Vesak Day",

  "2027-08-09": "National Day",

  "2027-10-28": "Deepavali",

  "2027-12-25": "Christmas Day"
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

const pad = (number) =>
  String(number).padStart(2, "0");

function formatDate(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function getToday() {
  return formatDate(new Date());
}

function prettyDate(dateString) {
  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function prettyToday(dateString) {
  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long"
  });
}

/* =========================================================
   BUTTON
   ========================================================= */

function AppButton({
  children,
  onClick,
  secondary = false,
  danger = false,
  disabled = false
}) {
  let className = "btn";

  if (secondary) className += " secondary";
  if (danger) className += " danger";

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const today = getToday();

  const todayObject =
    new Date(`${today}T00:00:00`);

  /* -------------------------
     SHARED DATABASE STATE
     ------------------------- */

  const [people, setPeople] = useState([]);

  const [leaveRecords, setLeaveRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [globalError, setGlobalError] =
    useState("");

  /* -------------------------
     APP UI STATE
     ------------------------- */

  const [tab, setTab] =
    useState("home");

  const [month, setMonth] =
    useState(
      new Date(
        todayObject.getFullYear(),
        todayObject.getMonth(),
        1
      )
    );

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [
    currentPersonId,
    setCurrentPersonId
  ] = useState(null);

  /* -------------------------
     ADD LEAVE
     ------------------------- */

  const [
    addLeaveOpen,
    setAddLeaveOpen
  ] = useState(false);

  const [form, setForm] =
    useState({
      personId: "",
      type: "Annual Leave",
      start: today,
      end: today
    });

  const [message, setMessage] =
    useState("");

  const [savingLeave, setSavingLeave] =
    useState(false);

  /* -------------------------
     DELETE LEAVE
     ------------------------- */

  const [
    deleteTarget,
    setDeleteTarget
  ] = useState(null);

  const [
    deletingLeave,
    setDeletingLeave
  ] = useState(false);

  /* -------------------------
     EDIT MEMBER
     ------------------------- */

  const [
    editingPersonId,
    setEditingPersonId
  ] = useState(null);

  const [
    editingName,
    setEditingName
  ] = useState("");

  const [
    savingName,
    setSavingName
  ] = useState(false);

  /* =======================================================
     DATABASE LOAD
     ======================================================= */

  async function loadTeam() {
    const response =
      await fetch(
        "/api/team",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Could not load team members."
      );
    }

    const records =
      await response.json();

    const mapped =
      records.map(
        (record) => ({
          id:
            Number(
              record.id
            ),

          name:
            record.name,

          group:
            Number(
              record.team_group
            )
        })
      );

    setPeople(mapped);

    setCurrentPersonId(
      (current) => {
        if (
          current &&
          mapped.some(
            (person) =>
              person.id ===
              current
          )
        ) {
          return current;
        }

        return (
          mapped[0]?.id ??
          null
        );
      }
    );

    return mapped;
  }

  async function loadLeave() {
    const response =
      await fetch(
        "/api/leave",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Could not load leave records."
      );
    }

    const records =
      await response.json();

    const mapped =
      records.map(
        (record) => ({
          id:
            Number(
              record.id
            ),

          personId:
            Number(
              record.person_id
            ),

          type:
            record.leave_type,

          start:
            record.start_date,

          end:
            record.end_date,

          createdAt:
            record.created_at
        })
      );

    setLeaveRecords(mapped);

    return mapped;
  }

  async function refreshData() {
    setGlobalError("");

    try {
      await Promise.all([
        loadTeam(),
        loadLeave()
      ]);
    } catch (error) {
      console.error(error);

      setGlobalError(
        error.message ||
          "Unable to load shared data."
      );
    }
  }

  useEffect(() => {
    async function initialise() {
      setLoading(true);

      await refreshData();

      setLoading(false);
    }

    initialise();
  }, []);

  /* =======================================================
     PERSON HELPERS
     ======================================================= */

  function getPerson(personId) {
    return people.find(
      (person) =>
        person.id ===
        Number(personId)
    );
  }

  function getPersonName(personId) {
    return (
      getPerson(
        personId
      )?.name ??
      "Unknown"
    );
  }

  function getPersonGroup(personId) {
    return (
      getPerson(
        personId
      )?.group ??
      0
    );
  }

  /* =======================================================
     LEAVE HELPERS
     ======================================================= */

  function peopleOnLeave(date) {
    return leaveRecords.filter(
      (record) =>
        record.start <= date &&
        record.end >= date
    );
  }

  function groupLeaveCount(
    date,
    group
  ) {
    const personIds =
      peopleOnLeave(date)
        .filter(
          (record) =>
            getPersonGroup(
              record.personId
            ) === group
        )
        .map(
          (record) =>
            record.personId
        );

    return new Set(
      personIds
    ).size;
  }

  /* =======================================================
     CALENDAR
     ======================================================= */

  const year =
    month.getFullYear();

  const monthNumber =
    month.getMonth();

  const firstDayOffset =
    (
      new Date(
        year,
        monthNumber,
        1
      ).getDay() + 6
    ) % 7;

  const daysInMonth =
    new Date(
      year,
      monthNumber + 1,
      0
    ).getDate();

  const calendarCells = [
    ...Array(
      firstDayOffset
    ).fill(null),

    ...Array.from(
      {
        length:
          daysInMonth
      },

      (_, index) =>
        new Date(
          year,
          monthNumber,
          index + 1
        )
    )
  ];

  /* =======================================================
     NEXT PUBLIC HOLIDAY
     ======================================================= */

  const nextHoliday =
    Object.entries(holidays)
      .filter(
        ([date]) =>
          date >= today
      )
      .sort(
        ([dateA], [dateB]) =>
          dateA.localeCompare(
            dateB
          )
      )[0];

  const daysToNextHoliday =
    nextHoliday
      ? Math.ceil(
          (
            new Date(
              `${nextHoliday[0]}T00:00:00`
            ) -
            new Date(
              `${today}T00:00:00`
            )
          ) /
            86400000
        )
      : null;

  /* =======================================================
     MY LEAVE
     ======================================================= */

  const myLeave =
    useMemo(() => {
      if (
        !currentPersonId
      ) {
        return [];
      }

      return leaveRecords
        .filter(
          (record) =>
            record.personId ===
            Number(
              currentPersonId
            )
        )
        .sort(
          (a, b) =>
            a.start.localeCompare(
              b.start
            )
        );
    }, [
      leaveRecords,
      currentPersonId
    ]);

  /* =======================================================
     OPEN ADD LEAVE
     ======================================================= */

  function openAddLeave(
    date = selectedDate
  ) {
    const defaultPerson =
      currentPersonId ??
      people[0]?.id ??
      "";

    setForm({
      personId:
        defaultPerson,

      type:
        "Annual Leave",

      start:
        date,

      end:
        date
    });

    setMessage("");

    setAddLeaveOpen(
      true
    );
  }

  /* =======================================================
     ADD LEAVE TO NEON
     ======================================================= */

  async function submitLeave() {
    setMessage("");

    if (
      !form.personId
    ) {
      setMessage(
        "Please select a team member."
      );

      return;
    }

    if (
      form.end <
      form.start
    ) {
      setMessage(
        "End date must be on or after the start date."
      );

      return;
    }

    setSavingLeave(true);

    try {
      const response =
        await fetch(
          "/api/leave",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                personId:
                  Number(
                    form.personId
                  ),

                leaveType:
                  form.type,

                startDate:
                  form.start,

                endDate:
                  form.end
              })
          }
        );

      if (!response.ok) {
        let errorMessage =
          "Unable to save leave.";

        try {
          const result =
            await response.json();

          errorMessage =
            result.message ||
            result.statusMessage ||
            result.error ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error.
        }

        throw new Error(
          errorMessage
        );
      }

      await loadLeave();

      setSelectedDate(
        form.start
      );

      setAddLeaveOpen(
        false
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Unable to save leave."
      );
    } finally {
      setSavingLeave(false);
    }
  }

  /* =======================================================
     DELETE LEAVE FROM NEON
     ======================================================= */

  async function confirmRemoveLeave() {
    if (!deleteTarget) {
      return;
    }

    setDeletingLeave(true);

    try {
      const response =
        await fetch(
          `/api/leave?id=${deleteTarget.id}`,
          {
            method:
              "DELETE"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Unable to remove leave."
        );
      }

      setDeleteTarget(
        null
      );

      await loadLeave();
    } catch (error) {
      console.error(error);

      setGlobalError(
        error.message ||
          "Unable to remove leave."
      );
    } finally {
      setDeletingLeave(
        false
      );
    }
  }

  /* =======================================================
     EDIT MEMBER NAME
     ======================================================= */

  function beginEditingPerson(
    person
  ) {
    setEditingPersonId(
      person.id
    );

    setEditingName(
      person.name
    );
  }

  function cancelEditingPerson() {
    setEditingPersonId(
      null
    );

    setEditingName("");
  }

  async function savePersonName(
    personId
  ) {
    const newName =
      editingName.trim();

    if (!newName) {
      return;
    }

    setSavingName(true);

    try {
      const response =
        await fetch(
          "/api/team",
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                id:
                  personId,

                name:
                  newName
              })
          }
        );

      if (!response.ok) {
        throw new Error(
          "Unable to update member name."
        );
      }

      await loadTeam();

      cancelEditingPerson();
    } catch (error) {
      console.error(error);

      setGlobalError(
        error.message ||
          "Unable to update member name."
      );
    } finally {
      setSavingName(false);
    }
  }

  /* =======================================================
     LEAVE ROW
     ======================================================= */

  function LeaveRow({
    record
  }) {
    const group =
      getPersonGroup(
        record.personId
      );

    return (
      <button
        type="button"
        className="leave-row"
        onClick={() =>
          setDeleteTarget(
            record
          )
        }
      >
        <div
          className={`avatar group-${group}`}
        >
          {getPersonName(
            record.personId
          ).substring(0, 1)}
        </div>

        <div className="leave-row-details">
          <strong>
            {getPersonName(
              record.personId
            )}
          </strong>

          <small>
            {record.type}
          </small>

          <small className="remove-hint">
            Tap to remove
          </small>
        </div>

        <div className="leave-dates">
          {prettyDate(
            record.start
          )}

          {record.end !==
            record.start && (
            <>
              <br />

              to{" "}
              {prettyDate(
                record.end
              )}
            </>
          )}
        </div>

        <X
          size={15}
          className="remove-icon"
        />
      </button>
    );
  }

  /* =======================================================
     HOME
     ======================================================= */

  function HomeScreen() {
    return (
      <>
        <div className="page-heading">
          <div>
            <small className="eyebrow">
              TODAY
            </small>

            <h2>
              {prettyToday(
                today
              )}
            </h2>
          </div>

          <AppButton
            onClick={() =>
              openAddLeave(
                today
              )
            }
          >
            <Plus size={16} />

            Add leave
          </AppButton>
        </div>

        <div className="group-grid">
          {[1, 2].map(
            (group) => {
              const away =
                groupLeaveCount(
                  today,
                  group
                );

              const full =
                away >= 2;

              const members =
                people.filter(
                  (person) =>
                    person.group ===
                    group
                );

              return (
                <section
                  key={group}
                  className={`group-card group-${group}`}
                >
                  <div className="group-title">
                    GROUP {group}
                  </div>

                  <h3
                    className={
                      full
                        ? "full"
                        : ""
                    }
                  >
                    {full
                      ? "FULL"
                      : "AVAILABLE"}
                  </h3>

                  <small className="capacity">
                    {away} of 2 away
                  </small>

                  <div className="member-list">
                    {members.map(
                      (member) => (
                        <div
                          className="member"
                          key={
                            member.id
                          }
                        >
                          <span
                            className={`member-dot group-${group}`}
                          />

                          {
                            member.name
                          }
                        </div>
                      )
                    )}
                  </div>
                </section>
              );
            }
          )}
        </div>

        <section className="card">
          <h3 className="section-title">
            <Users
              size={18}
            />

            Who's on leave today
          </h3>

          {peopleOnLeave(
            today
          ).length ? (
            peopleOnLeave(
              today
            ).map(
              (record) => (
                <LeaveRow
                  key={
                    record.id
                  }
                  record={
                    record
                  }
                />
              )
            )
          ) : (
            <p className="muted">
              Nobody is on leave today.
            </p>
          )}
        </section>

        {nextHoliday && (
          <section className="holiday-card">
            <small>
              NEXT PUBLIC HOLIDAY
            </small>

            <h2>
              {nextHoliday[1]}
            </h2>

            <p>
              {prettyDate(
                nextHoliday[0]
              )}
            </p>

            <div className="countdown">
              <Timer
                size={17}
              />

              {
                daysToNextHoliday
              }{" "}
              days to go
            </div>
          </section>
        )}
      </>
    );
  }

  /* =======================================================
     CALENDAR
     ======================================================= */

  function CalendarScreen() {
    return (
      <>
        <div className="calendar-heading">
          <AppButton
            secondary
            onClick={() =>
              setMonth(
                new Date(
                  year,
                  monthNumber - 1,
                  1
                )
              )
            }
          >
            <ChevronLeft />
          </AppButton>

          <h2>
            {month.toLocaleDateString(
              "en-SG",
              {
                month:
                  "long",

                year:
                  "numeric"
              }
            )}
          </h2>

          <AppButton
            secondary
            onClick={() =>
              setMonth(
                new Date(
                  year,
                  monthNumber + 1,
                  1
                )
              )
            }
          >
            <ChevronRight />
          </AppButton>
        </div>

        <section className="calendar-card">
          <div className="week-header">
            {[
              "M",
              "T",
              "W",
              "T",
              "F",
              "S",
              "S"
            ].map(
              (
                day,
                index
              ) => (
                <div
                  key={
                    index
                  }
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div className="calendar-grid">
            {calendarCells.map(
              (
                date,
                index
              ) => {
                if (!date) {
                  return (
                    <div
                      key={`blank-${index}`}
                    />
                  );
                }

                const dateString =
                  formatDate(
                    date
                  );

                const records =
                  peopleOnLeave(
                    dateString
                  );

                const selected =
                  selectedDate ===
                  dateString;

                const holiday =
                  holidays[
                    dateString
                  ];

                return (
                  <button
                    type="button"
                    key={
                      dateString
                    }
                    className={[
                      "calendar-day",

                      selected
                        ? "selected"
                        : "",

                      holiday
                        ? "holiday"
                        : ""
                    ].join(" ")}
                    onClick={() =>
                      setSelectedDate(
                        dateString
                      )
                    }
                  >
                    <span className="day-number">
                      {
                        date.getDate()
                      }
                    </span>

                    <div className="leave-dots">
                      {records.map(
                        (
                          record
                        ) => (
                          <span
                            key={
                              record.id
                            }
                            className={`leave-dot group-${getPersonGroup(
                              record.personId
                            )}`}
                          />
                        )
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="card">
          <div className="page-heading">
            <div>
              <small className="eyebrow">
                SELECTED DATE
              </small>

              <h3>
                {prettyDate(
                  selectedDate
                )}
              </h3>

              {holidays[
                selectedDate
              ] && (
                <small className="holiday-name">
                  {
                    holidays[
                      selectedDate
                    ]
                  }
                </small>
              )}
            </div>

            <AppButton
              onClick={() =>
                openAddLeave(
                  selectedDate
                )
              }
            >
              <Plus
                size={15}
              />

              Leave
            </AppButton>
          </div>

          <div className="group-grid compact">
            {[1, 2].map(
              (group) => {
                const away =
                  groupLeaveCount(
                    selectedDate,
                    group
                  );

                const full =
                  away >= 2;

                return (
                  <div
                    key={
                      group
                    }
                    className={`selected-group group-${group}`}
                  >
                    <strong>
                      GROUP{" "}
                      {group}
                    </strong>

                    <span>
                      {full
                        ? "FULL"
                        : "AVAILABLE"}{" "}
                      ·{" "}
                      {away}/2
                    </span>
                  </div>
                );
              }
            )}
          </div>

          {peopleOnLeave(
            selectedDate
          ).length ? (
            peopleOnLeave(
              selectedDate
            ).map(
              (record) => (
                <LeaveRow
                  key={
                    record.id
                  }
                  record={
                    record
                  }
                />
              )
            )
          ) : (
            <p className="muted">
              Nobody is on leave.
            </p>
          )}
        </section>
      </>
    );
  }

  /* =======================================================
     MY LEAVE
     ======================================================= */

  function MyLeaveScreen() {
    return (
      <>
        <div>
          <small className="eyebrow">
            PROFILE
          </small>

          <h2>
            My Leave
          </h2>
        </div>

        <section className="card">
          <label className="field-label">
            Preview as
          </label>

          <select
            className="input black-text"
            value={
              currentPersonId ??
              ""
            }
            onChange={(
              event
            ) =>
              setCurrentPersonId(
                Number(
                  event
                    .target
                    .value
                )
              )
            }
          >
            {people.map(
              (person) => (
                <option
                  key={
                    person.id
                  }
                  value={
                    person.id
                  }
                >
                  {
                    person.name
                  }
                </option>
              )
            )}
          </select>
        </section>

        <section className="card">
          <h3>
            Upcoming leave
          </h3>

          {myLeave.length ? (
            myLeave.map(
              (record) => (
                <LeaveRow
                  key={
                    record.id
                  }
                  record={
                    record
                  }
                />
              )
            )
          ) : (
            <p className="muted">
              No leave added yet.
            </p>
          )}
        </section>
      </>
    );
  }

  /* =======================================================
     TEAM SETTINGS
     ======================================================= */

  function TeamSettingsScreen() {
    function TeamGroup({
      group,
      title
    }) {
      return (
        <section
          className={`team-settings-card group-${group}`}
        >
          <div className="team-settings-title">
            <Users
              size={18}
            />

            <strong>
              {title}
            </strong>
          </div>

          {people
            .filter(
              (person) =>
                person.group ===
                group
            )
            .map(
              (
                person
              ) => (
                <div
                  className="team-member-row"
                  key={
                    person.id
                  }
                >
                  {editingPersonId ===
                  person.id ? (
                    <>
                      <input
                        className="input"
                        autoFocus
                        value={
                          editingName
                        }
                        onChange={(
                          event
                        ) =>
                          setEditingName(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            savePersonName(
                              person.id
                            );
                          }

                          if (
                            event.key ===
                            "Escape"
                          ) {
                            cancelEditingPerson();
                          }
                        }}
                      />

                      <button
                        type="button"
                        className="member-save"
                        disabled={
                          savingName
                        }
                        onClick={() =>
                          savePersonName(
                            person.id
                          )
                        }
                      >
                        <Check
                          size={17}
                        />
                      </button>

                      <button
                        type="button"
                        className="member-cancel"
                        disabled={
                          savingName
                        }
                        onClick={
                          cancelEditingPerson
                        }
                      >
                        <X
                          size={17}
                        />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`member-dot group-${group}`}
                      />

                      <strong className="team-name">
                        {
                          person.name
                        }
                      </strong>

                      <button
                        type="button"
                        className="member-edit"
                        onClick={() =>
                          beginEditingPerson(
                            person
                          )
                        }
                      >
                        <Pencil
                          size={15}
                        />

                        Edit
                      </button>
                    </>
                  )}
                </div>
              )
            )}
        </section>
      );
    }

    return (
      <>
        <div>
          <small className="eyebrow">
            TEAM SETTINGS
          </small>

          <h2>
            Edit member names
          </h2>

          <p className="muted">
            Rename a member when
            somebody leaves or a
            replacement joins. Group
            assignments remain fixed.
          </p>
        </div>

        <TeamGroup
          group={1}
          title="Group 1"
        />

        <TeamGroup
          group={2}
          title="Group 2"
        />

        <TeamGroup
          group={0}
          title="Team Leader"
        />

        <section className="card">
          <strong>
            Shared team settings
          </strong>

          <p className="muted">
            Name changes are saved to
            the shared database and will
            appear for everyone using
            the Leave Planner.
          </p>

          <p className="muted">
            Team-member slots cannot be
            deleted and their coverage
            groups remain unchanged.
          </p>
        </section>
      </>
    );
  }

  /* =======================================================
     LOADING SCREEN
     ======================================================= */

  if (loading) {
    return (
      <main>
        <div className="app-shell">
          <header className="main-header">
            <small>
              TEAM LEAVE
            </small>

            <h1>
              Leave Planner
            </h1>

            <p>
              Loading shared team data...
            </p>
          </header>

          <section className="card">
            <h3 className="section-title">
              <RefreshCw
                size={18}
              />

              Loading
            </h3>

            <p className="muted">
              Connecting to the shared
              leave calendar.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN LAYOUT
     ======================================================= */

  return (
    <main>
      <div className="app-shell">
        <header className="main-header">
          <small>
            TEAM LEAVE
          </small>

          <h1>
            Leave Planner
          </h1>

          <p>
            Shared leave calendar and
            cover availability.
          </p>
        </header>

        {globalError && (
          <div className="error-message">
            {globalError}

            <div
              style={{
                marginTop:
                  "10px"
              }}
            >
              <AppButton
                secondary
                onClick={
                  refreshData
                }
              >
                <RefreshCw
                  size={15}
                />

                Try again
              </AppButton>
            </div>
          </div>
        )}

        {tab === "home" && (
          <HomeScreen />
        )}

        {tab ===
          "calendar" && (
          <CalendarScreen />
        )}

        {tab === "me" && (
          <MyLeaveScreen />
        )}

        {tab ===
          "settings" && (
          <TeamSettingsScreen />
        )}
      </div>

      {/* ===================================================
          NAVIGATION
         =================================================== */}

      <nav
        className="bottom-nav"
        style={{
          gridTemplateColumns:
            "repeat(5, 1fr)"
        }}
      >
        <button
          type="button"
          onClick={() =>
            setTab("home")
          }
        >
          <Home
            size={20}
          />

          Home
        </button>

        <button
          type="button"
          onClick={() =>
            setTab(
              "calendar"
            )
          }
        >
          <CalendarDays
            size={20}
          />

          Calendar
        </button>

        <button
          type="button"
          onClick={() =>
            openAddLeave(
              selectedDate
            )
          }
        >
          <Plus
            size={20}
          />

          Add Leave
        </button>

        <button
          type="button"
          onClick={() =>
            setTab("me")
          }
        >
          <UserRound
            size={20}
          />

          My Leave
        </button>

        <button
          type="button"
          onClick={() =>
            setTab(
              "settings"
            )
          }
        >
          <Settings
            size={20}
          />

          Team
        </button>
      </nav>

      {/* ===================================================
          ADD LEAVE
         =================================================== */}

      {addLeaveOpen && (
        <div className="modal-backdrop">
          <div className="bottom-sheet">
            <div className="modal-heading">
              <div>
                <small>
                  NEW LEAVE
                </small>

                <h2>
                  Add leave
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                disabled={
                  savingLeave
                }
                onClick={() =>
                  setAddLeaveOpen(
                    false
                  )
                }
              >
                <X />
              </button>
            </div>

            <label className="field-label">
              Team member
            </label>

            <select
              className="input"
              value={
                form.personId
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  personId:
                    Number(
                      event
                        .target
                        .value
                    )
                })
              }
            >
              {people.map(
                (person) => (
                  <option
                    key={
                      person.id
                    }
                    value={
                      person.id
                    }
                  >
                    {
                      person.name
                    }
                  </option>
                )
              )}
            </select>

            <label className="field-label">
              Leave type
            </label>

            <select
              className="input"
              value={
                form.type
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,

                  type:
                    event
                      .target
                      .value
                })
              }
            >
              <option>
                Annual Leave
              </option>

              <option>
                Medical Leave
              </option>

              <option>
                Childcare Leave
              </option>

              <option>
                Other Leave
              </option>
            </select>

            <div className="two-columns">
              <div>
                <label className="field-label">
                  Start date
                </label>

                <input
                  className="input"
                  type="date"
                  value={
                    form.start
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,

                      start:
                        event
                          .target
                          .value
                    })
                  }
                />
              </div>

              <div>
                <label className="field-label">
                  End date
                </label>

                <input
                  className="input"
                  type="date"
                  value={
                    form.end
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,

                      end:
                        event
                          .target
                          .value
                    })
                  }
                />
              </div>
            </div>

            {message && (
              <div className="error-message">
                {message}
              </div>
            )}

            <AppButton
              onClick={
                submitLeave
              }
              disabled={
                savingLeave
              }
            >
              {savingLeave
                ? "Saving..."
                : "Save leave"}
            </AppButton>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE LEAVE
         =================================================== */}

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="bottom-sheet">
            <div className="delete-icon">
              <X
                size={24}
              />
            </div>

            <h2>
              Remove leave?
            </h2>

            <p className="confirmation-copy">
              You are about to remove{" "}

              <strong>
                {getPersonName(
                  deleteTarget.personId
                )}
              </strong>

              's{" "}

              {deleteTarget.type.toLowerCase()}{" "}

              from{" "}

              <strong>
                {prettyDate(
                  deleteTarget.start
                )}
              </strong>

              {deleteTarget.end !==
                deleteTarget.start && (
                <>
                  {" "}
                  to{" "}

                  <strong>
                    {prettyDate(
                      deleteTarget.end
                    )}
                  </strong>
                </>
              )}

              .
            </p>

            <p className="confirmation-copy">
              This will remove the leave
              from the shared calendar
              for everyone.
            </p>

            <div className="two-columns">
              <AppButton
                secondary
                disabled={
                  deletingLeave
                }
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
              >
                Keep leave
              </AppButton>

              <AppButton
                danger
                disabled={
                  deletingLeave
                }
                onClick={
                  confirmRemoveLeave
                }
              >
                {deletingLeave
                  ? "Removing..."
                  : "Yes, remove"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
