// Court configuration with priority order
// Hamilton is primary, others are backups

export interface CourtConfig {
  name: string;
  selector: string;
  priority: number;
}

export const COURTS: CourtConfig[] = [
  {
    name: "Hamilton",
    selector: '.court-hamilton, [data-court="hamilton"], button:has-text("Hamilton")',
    priority: 1,
  },
  {
    name: "Court 2",
    selector: '.court-2, [data-court="court-2"], button:has-text("Court 2")',
    priority: 2,
  },
  {
    name: "Court 3", 
    selector: '.court-3, [data-court="court-3"], button:has-text("Court 3")',
    priority: 3,
  },
  {
    name: "Court 4",
    selector: '.court-4, [data-court="court-4"], button:has-text("Court 4")',
    priority: 4,
  },
  {
    name: "Any Available",
    selector: '.court-available, [data-available="true"], .available-court',
    priority: 5,
  },
] as const;
