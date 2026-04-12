/**
 * Pure functions that return Chart.js config objects for QuickChart.
 * No HTTP, no DB — easy to test and reuse.
 */

const BRAND_GREEN = '#166534';
const GREEN_500 = '#22c55e';
const GREEN_300 = '#86efac';
const BLUE_500 = '#3b82f6';
const AMBER_500 = '#f59e0b';
const RED_500 = '#ef4444';
const ZINC_400 = '#a1a1aa';
const WHITE = '#ffffff';

function doughnutDefaults() {
  return {
    plugins: {
      datalabels: {
        color: '#111827',
        font: { weight: 'bold', size: 13 },
        formatter: (value) => (value > 0 ? value : ''),
      },
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12 } },
      },
    },
  };
}

function barDefaults() {
  return {
    plugins: {
      datalabels: {
        color: '#111827',
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold', size: 11 },
        formatter: (value) => (value > 0 ? value : ''),
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, font: { size: 11 } },
        grid: { color: '#e5e7eb' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };
}

/**
 * Session status doughnut (PLANNED / IN_PROGRESS / COMPLETED).
 */
export function buildSessionStatusPieConfig(byStatus) {
  const labels = Object.keys(byStatus);
  const data = Object.values(byStatus);
  const colorMap = {
    PLANNED: ZINC_400,
    IN_PROGRESS: BLUE_500,
    COMPLETED: GREEN_500,
  };
  const colors = labels.map((l) => colorMap[l] || AMBER_500);

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    },
    options: doughnutDefaults(),
  };
}

/**
 * Aggregate attendance bar (present / excused / no-show totals).
 */
export function buildAttendanceTotalsBarConfig({
  sumPresent,
  sumExcused,
  sumNoShow,
}) {
  return {
    type: 'bar',
    data: {
      labels: ['Present', 'Excused', 'No-show'],
      datasets: [
        {
          data: [sumPresent, sumExcused, sumNoShow],
          backgroundColor: [GREEN_500, BLUE_500, RED_500],
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    },
    options: barDefaults(),
  };
}

/**
 * Served vs planned grouped bar (per-session or aggregated buckets).
 * `entries` = [{ label, planned, served }]
 */
export function buildServedVsPlannedBarConfig(entries) {
  return {
    type: 'bar',
    data: {
      labels: entries.map((e) => e.label),
      datasets: [
        {
          label: 'Planned',
          data: entries.map((e) => e.planned),
          backgroundColor: GREEN_300,
          borderRadius: 4,
        },
        {
          label: 'Served',
          data: entries.map((e) => e.served),
          backgroundColor: BRAND_GREEN,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...barDefaults(),
      plugins: {
        ...barDefaults().plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: { font: { size: 12 } },
        },
      },
    },
  };
}

/**
 * No-shows by meal type horizontal bar.
 */
export function buildNoShowByMealBarConfig(byMeal) {
  const labels = Object.keys(byMeal);
  const data = Object.values(byMeal);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: RED_500,
          borderRadius: 4,
          barPercentage: 0.55,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      plugins: {
        datalabels: {
          color: WHITE,
          font: { weight: 'bold', size: 12 },
          anchor: 'center',
          align: 'center',
          formatter: (value) => (value > 0 ? value : ''),
        },
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, font: { size: 11 } },
          grid: { color: '#e5e7eb' },
        },
        y: {
          ticks: { font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
  };
}

/**
 * Guardian email status doughnut (SENT / SKIPPED / FAILED / —).
 */
export function buildEmailStatusPieConfig(byEmail) {
  const labels = Object.keys(byEmail);
  const data = Object.values(byEmail);
  const colorMap = {
    SENT: GREEN_500,
    SKIPPED: AMBER_500,
    FAILED: RED_500,
  };
  const colors = labels.map((l) => colorMap[l] || ZINC_400);

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    },
    options: doughnutDefaults(),
  };
}

/**
 * Roster status doughnut (PRESENT / EXCUSED / NO_SHOW / NOT_MARKED).
 */
export function buildRosterStatusPieConfig(rosterStats) {
  const segments = [
    { label: 'Present', value: rosterStats.PRESENT, color: GREEN_500 },
    { label: 'Excused', value: rosterStats.EXCUSED, color: BLUE_500 },
    { label: 'No-show', value: rosterStats.NO_SHOW, color: RED_500 },
    { label: 'Not marked', value: rosterStats.NOT_MARKED, color: ZINC_400 },
  ].filter((s) => s.value > 0);

  return {
    type: 'doughnut',
    data: {
      labels: segments.map((s) => s.label),
      datasets: [
        {
          data: segments.map((s) => s.value),
          backgroundColor: segments.map((s) => s.color),
          borderWidth: 0,
        },
      ],
    },
    options: doughnutDefaults(),
  };
}
