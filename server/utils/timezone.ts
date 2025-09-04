// Pacific timezone utilities with DST awareness

export function getPacificTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
}

export function getNextWeekdayAt8AM(): Date {
  const now = getPacificTime();
  let nextRun = new Date(now);
  
  // Set to next weekday at 8:00 AM PT
  nextRun.setHours(8, 0, 0, 0);
  
  // If it's past 8 AM today, move to next day
  if (now.getHours() >= 8) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  // Skip weekends - move to next Monday if needed
  while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
}

export function getTargetBookingDate(): Date {
  const now = getPacificTime();
  const targetDate = new Date(now);
  
  // Book 7 days in advance
  targetDate.setDate(targetDate.getDate() + 7);
  
  return targetDate;
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

export function formatPacificTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

export function getTimeUntilNext8AM(): number {
  const now = getPacificTime();
  const next8AM = getNextWeekdayAt8AM();
  return next8AM.getTime() - now.getTime();
}
