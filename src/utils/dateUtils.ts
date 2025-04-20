
export type DateSelection = Date | { from: Date; to: Date } | undefined;

export function isDateRange(selection: DateSelection): selection is { from: Date; to: Date } {
  return (
    typeof selection === "object" &&
    selection !== null &&
    "from" in selection &&
    "to" in selection &&
    selection.from instanceof Date &&
    selection.to instanceof Date
  );
}

