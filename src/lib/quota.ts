/**
 * Thailand Section 33 (Persons with Disabilities Empowerment Act): 1 employee with a disability
 * per 100 staff, plus 1 when the remainder exceeds 50 (section 7.10).
 */
export function requiredHires(n: number): number {
  if (!Number.isFinite(n) || n < 100) return 0;
  const staff = Math.floor(n);
  return Math.floor(staff / 100) + (staff % 100 > 50 ? 1 : 0);
}

/** Gap between required and current hires (never negative). */
export function quotaGap(employees: number, currentHires: number) {
  const required = requiredHires(employees);
  return { required, gap: Math.max(0, required - Math.max(0, Math.floor(currentHires || 0))) };
}

/** Levy estimate only when the authority's amount is configured — never hard-coded. */
export function levyEstimate(gap: number, perPersonThb: number | null) {
  return perPersonThb && perPersonThb > 0 ? gap * perPersonThb : null;
}
