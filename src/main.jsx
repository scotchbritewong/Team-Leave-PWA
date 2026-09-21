import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  Timer,
  UserRound,
  Users,
  X
} from "lucide-react";
import "./style.css";

const people = [
  { name: "Ariel", group: 1 },
  { name: "Clarissa", group: 1 },
  { name: "Eileen", group: 1 },
  { name: "Jarrett", group: 1 },

  { name: "Hui Hui", group: 2 },
  { name: "Benny", group: 2 },
  { name: "Daphne", group: 2 },
  { name: "Sam", group: 2 },

  { name: "Wong McCholas", group: 0 }
];

const initialLeave = [
  {
    id: 1,
    name: "Clarissa",
    start: "2026-09-22",
    end: "2026-09-23",
    type: "Annual Leave"
  },
  {
    id: 2,
    name: "Benny",
    start: "2026-09-24",
    end: "2026-09-25",
    type: "Annual Leave"
  },
  {
    id: 3,
    name: "Wong McCholas",
    start: "2026-09-28",
    end: "2026-09-28",
    type: "Annual Leave"
  },
  {
    id: 4,
    name: "Ariel",
    start: "2026-10-05",
    end: "2026-10-06",
    type: "Annual Leave"
  }
];

const holidays = {
  // 2026

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

  // 2027

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

const today = "2026-09-21";

const pad = (n) => String(n).padStart(2, "0");

const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;

const prettyDate = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const getGroup = (name) =>
  people.find((person) => person.name === name)?.group ?? 0;

function AppButton({
  children,
  onClick,
  secondary = false,
  danger = false
}) {
  let className = "btn";

  if (secondary) className += " secondary";
  if (danger) className += " danger";

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");

  const [month, setMonth] = useState(new Date(2026, 8, 1));

  const [selectedDate, setSelectedDate] = useState(today);

  const [leaveRecords, setLeaveRecords] = useState(initialLeave);

  const [currentPerson, setCurrentPerson] = useState("Ariel");

  const [addLeaveOpen, setAddLeaveOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "Ariel",
    type: "Annual Leave",
    start: today,
    end: today
  });

  const peopleOnLeave = (date) =>
    leaveRecords.filter(
      (record) => record.start <= date && record.end >= date
    );

  const groupLeaveCount = (date, group) =>
    new Set(
      peopleOnLeave(date)
        .filter((record) => getGroup(record.name) === group)
        .map((record) => record.name)
    ).size;

  const year = month.getFullYear();
  const monthNumber = month.getMonth();

  const firstDayOffset =
    (new Date(year, monthNumber, 1).getDay() + 6) % 7;

  const daysInMonth = new Date(
    year,
    monthNumber + 1,
    0
  ).getDate();

  const calendarCells = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, monthNumber, i + 1)
    )
  ];

  const nextHoliday = Object.entries(holidays)
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b))[0];

  const daysToNextHoliday = nextHoliday
    ? Math.ceil(
        (new Date(`${nextHoliday[0]}T00:00:00`) -
          new Date(`${today}T00:00:00`)) /
          86400000
      )
    : null;

  const myLeave = useMemo(
    () =>
      leaveRecords
        .filter((record) => record.name === currentPerson)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [leaveRecords, currentPerson]
  );

  function openAddLeave(date = selectedDate) {
    setForm({
      name: currentPerson,
      type: "Annual Leave",
      start: date,
      end: date
    });

    setMessage("");
    setAddLeaveOpen(true);
  }

  function submitLeave() {
    setMessage("");

    if (form.end < form.start) {
      setMessage("End date must be on or after the start date.");
      return;
    }

    const group = getGroup(form.name);

    if (group !== 0) {
      let date = new Date(`${form.start}T00:00:00`);
      const endDate = new Date(`${form.end}T00:00:00`);

      while (date <= endDate) {
        const dateString = formatDate(date);

        const others = new Set(
          peopleOnLeave(dateString)
            .filter(
              (record) =>
                getGroup(record.name) === group &&
                record.name !== form.name
            )
            .map((record) => record.name)
        ).size;

        if (others >= 2) {
          setMessage(
            `Group ${group} is FULL on ${prettyDate(
              dateString
            )}. Two teammates are already on leave.`
          );
          return;
        }

        date.setDate(date.getDate() + 1);
      }
    }

    setLeaveRecords((records) => [
      ...records,
      {
        id: Date.now(),
        name: form.name,
        type: form.type,
        start: form.start,
        end: form.end
      }
    ]);

    setSelectedDate(form.start);
    setAddLeaveOpen(false);
  }

  function confirmRemoveLeave() {
    if (!deleteTarget) return;

    setLeaveRecords((records) =>
      records.filter((record) => record.id !== deleteTarget.id)
    );

    setDeleteTarget(null);
  }

  function LeaveRow({ record }) {
    const group = getGroup(record.name);

    return (
      <button
        className="leave-row"
        onClick={() => setDeleteTarget(record)}
      >
        <div className={`avatar group-${group}`}>
          {record.name.substring(0, 1)}
        </div>

        <div className="leave-row-details">
          <strong>{record.name}</strong>

          <small>{record.type}</small>

          <small className="remove-hint">
            Tap to remove
          </small>
        </div>

        <div className="leave-dates">
          {prettyDate(record.start)}

          {record.end !== record.start && (
            <>
              <br />
              to {prettyDate(record.end)}
            </>
          )}
        </div>

        <X size={15} className="remove-icon" />
      </button>
    );
  }

  function HomeScreen() {
    return (
      <>
        <div className="page-heading">
          <div>
            <small className="eyebrow">TODAY</small>

            <h2>21 September</h2>
          </div>

          <AppButton onClick={() => openAddLeave(today)}>
            <Plus size={16} />
            Add leave
          </AppButton>
        </div>

        <div className="group-grid">
          {[1, 2].map((group) => {
            const away = groupLeaveCount(today, group);
            const full = away >= 2;

            return (
              <section
                key={group}
                className={`group-card group-${group}`}
              >
                <div className="group-title">
                  GROUP {group}
                </div>

                <h3 className={full ? "full" : ""}>
                  {full ? "FULL" : "AVAILABLE"}
                </h3>

                <small className="capacity">
                  {away} of 2 away
                </small>

                <div className="member-list">
                  {people
                    .filter((person) => person.group === group)
                    .map((person) => (
                      <div
                        className="member"
                        key={person.name}
                      >
                        <span
                          className={`member-dot group-${group}`}
                        />

                        {person.name}
                      </div>
                    ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="card">
          <h3 className="section-title">
            <Users size={18} />
            Who's on leave today
          </h3>

          {peopleOnLeave(today).length ? (
            peopleOnLeave(today).map((record) => (
              <LeaveRow
                key={record.id}
                record={record}
              />
            ))
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

            <h2>{nextHoliday[1]}</h2>

            <p>{prettyDate(nextHoliday[0])}</p>

            <div className="countdown">
              <Timer size={17} />
              {daysToNextHoliday} days to go
            </div>
          </section>
        )}
      </>
    );
  }

  function CalendarScreen() {
    return (
      <>
        <div className="calendar-heading">
          <AppButton
            secondary
            onClick={() =>
              setMonth(
                new Date(year, monthNumber - 1, 1)
              )
            }
          >
            <ChevronLeft />
          </AppButton>

          <h2>
            {month.toLocaleDateString("en-SG", {
              month: "long",
              year: "numeric"
            })}
          </h2>

          <AppButton
            secondary
            onClick={() =>
              setMonth(
                new Date(year, monthNumber + 1, 1)
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
            ].map((day, index) => (
              <div key={index}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((date, index) => {
              if (!date) {
                return (
                  <div key={`blank-${index}`} />
                );
              }

              const dateString = formatDate(date);

              const leave =
                peopleOnLeave(dateString);

              const selected =
                selectedDate === dateString;

              const holiday =
                holidays[dateString];

              return (
                <button
                  key={dateString}
                  className={[
                    "calendar-day",
                    selected ? "selected" : "",
                    holiday ? "holiday" : ""
                  ].join(" ")}
                  onClick={() =>
                    setSelectedDate(dateString)
                  }
                >
                  <span className="day-number">
                    {date.getDate()}
                  </span>

                  <div className="leave-dots">
                    {leave.map((record) => (
                      <span
                        key={record.id}
                        className={`leave-dot group-${getGroup(
                          record.name
                        )}`}
                        title={record.name}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="page-heading">
            <div>
              <small className="eyebrow">
                SELECTED DATE
              </small>

              <h3>{prettyDate(selectedDate)}</h3>

              {holidays[selectedDate] && (
                <small className="holiday-name">
                  {holidays[selectedDate]}
                </small>
              )}
            </div>

            <AppButton
              onClick={() =>
                openAddLeave(selectedDate)
              }
            >
              <Plus size={15} />
        
