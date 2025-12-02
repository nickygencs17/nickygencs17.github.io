/**
 * tenure.js
 * Auto-calculates "Present (X years Y months)" durations for roles.
 *
 * Usage:
 * - Add data-start (YYYY-MM-DD) to the container element (e.g., <p class="meta">)
 * - Optionally add data-end (YYYY-MM-DD) for non-present roles
 * - Include a child <span data-tenure></span> where the computed text should go
 *
 * Example:
 * <p class="meta" data-start="2022-08-01">August 2022 – Present (<span data-tenure></span>)</p>
 */
'use strict';

(() => {
  // Compute full calendar months between two dates (no partial-month overcount)
  const diffFullMonths = (startDate, endDate) => {
    const sy = startDate.getFullYear();
    const sm = startDate.getMonth(); // 0-11
    const sd = startDate.getDate();

    const ey = endDate.getFullYear();
    const em = endDate.getMonth();
    const ed = endDate.getDate();

    let months = (ey - sy) * 12 + (em - sm);
    if (ed < sd) months -= 1;
    return Math.max(months, 0);
  };

  const formatMonths = (totalMonths) => {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    // Show months if there are months, or "0 months" when years is 0 so it's never empty
    if (months > 0 || years === 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);

    return parts.join(" ");
  };

  const updateTenureNodes = () => {
    const nodes = document.querySelectorAll(".meta[data-start]");
    if (!nodes.length) return;

    const now = new Date();

    for (const el of nodes) {
      const startAttr = el.dataset.start;
      const endAttr = el.dataset.end;

      if (!startAttr) continue;

      const start = new Date(startAttr);
      if (Number.isNaN(start.getTime())) continue;

      const parsedEnd = endAttr ? new Date(endAttr) : now;
      const end = Number.isNaN(parsedEnd.getTime()) ? now : parsedEnd;

      let months = diffFullMonths(start, end);
      if (!endAttr) months = Math.max(0, months + 1);
      const formatted = formatMonths(months);

      const slot = el.querySelector("[data-tenure]");
      if (slot) {
        slot.textContent = formatted;
      } else {
        // Fallback: append at end if no slot provided
        el.append(` ${formatted}`);
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateTenureNodes);
  } else {
    updateTenureNodes();
  }
})();
