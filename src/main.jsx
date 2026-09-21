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

/* ============================================================
   TEAM SETUP
   ============================================================ */

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

/* ============================================================
   SAMPLE LEAVE
   ============================================================ */

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

/* ============================================================
   SINGAPORE PUBLIC HOLIDAYS 2026
   ============================================================ */

const holidays = {
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

  "2026-12-25": "Christmas Day"
};

/* ============================================================
   DATE HELPERS
   ============================================================ */

const pad = (number) => String(number).padStart(2, "0");

function formatDate(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function prettyDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-SG",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}

function getGroup(name) {
  return people.find((person) => person.name === name)?.group ?? 0;
}

/* ============================================================
   BUTTON COMPONENT
   ============================================================ */

function AppButton({
  children,
  onClick,
  secondary = false,
  danger = false
}) {
  let classes = "btn";

  if (secondary) classes += " secondary";
  if (danger) classes += " danger";

  return (
    <button className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */

function App() {
  const today = "2026-09-21";

  const [tab, setTab] = useState("home");

  const [month, setMonth] = useState(
    new Date(2026, 8, 1)
  );

  const [selectedDate, setSelectedDate] = useState(today);

  const [leaveRecords, setLeaveRecords] =
    useState(initialLeave);

  const [addLeaveOpen, setAddLeaveOpen] =
    useState(false);

  const [currentPerson, setCurrentPerson] =
    useState("Ariel");

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "Ariel",
    type: "Annual Leave",
    start: today,
    end: today
  });

  /* ==========================================================
     WHO IS ON LEAVE
     ========================================================== */

  function peopleOnLeave(date) {
    return leaveRecords.filter(
      (record) =>
        record.start <= date &&
        record.end >= date
    );
  }

  function groupLeaveCount(date, group) {
    const names = peopleOnLeave(date)
      .filter(
        (record) =>
          getGroup(record.name) === group
      )
      .map((record) => record.name);

    return new Set(names).size;
  }

  /* ==========================================================
     CALENDAR
     ========================================================== */

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
      (_, index) =>
        new Date(year, monthNumber, index + 1)
    )
  ];

  /* ==========================================================
     NEXT PUBLIC HOLIDAY
     ========================================================== */

  const nextHoliday = Object.entries(holidays)
    .filter(([date]) => date >= today)
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    )[0];

  const daysToNextHoliday = nextHoliday
    ? Math.ceil(
        (new Date(`${nextHoliday[0]}T00:00:00`) -
          new Date(`${today}T00:00:00`)) /
          86400000
      )
    : null;

  /* ==========================================================
     MY LEAVE
     ========================================================== */

  const myLeave = useMemo(() => {
    return leaveRecords
      .filter(
        (record) =>
          record.name === currentPerson
      )
      .sort((a, b) =>
        a.start.localeCompare(b.start)
      );
  }, [leaveRecords, currentPerson]);

  /* ==========================================================
     ADD LEAVE
     ========================================================== */

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
      setMessage(
        "End date must be on or after the start date."
      );
      return;
    }

    const group = getGroup(form.name);

    if (group !== 0) {
      let date = new Date(`${form.start}T00:00:00`);
      const endDate = new Date(`${form.end}T00:00:00`);

      while (date <= endDate) {
        const dateString = formatDate(date);

        const otherNames = peopleOnLeave(dateString)
          .filter(
            (record) =>
              getGroup(record.name) === group &&
              record.name !== form.name
          )
          .map((record) => record.name);

        const otherPeopleAway =
          new Set(otherNames).size;

        if (otherPeopleAway >= 2) {
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

    setLeaveRecords((current) => [
      ...current,
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

  /* ==========================================================
     REMOVE LEAVE
     ========================================================== */

  function confirmRemoveLeave() {
    if (!deleteTarget) return;

    setLeaveRecords((current) =>
      current.filter(
        (record) =>
          record.id !== deleteTarget.id
      )
    );

    setDeleteTarget(null);
  }

  /* ==========================================================
     LEAVE ROW
     ========================================================== */

  function LeaveRow
