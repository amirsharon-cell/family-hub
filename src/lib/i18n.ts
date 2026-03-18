export type Lang = 'en' | 'he'

const strings = {
  en: {
    // App
    appName: 'Family Hub',
    appSubtitle: 'Shared calendar & resources for your family',
    appPrivacy: 'Family Hub uses Google Calendar to store your events. No data is stored outside of your Google account.',

    // Auth
    signIn: 'Sign in with Google',
    signOut: 'Sign out',

    // Setup
    setUpTitle: 'Set up calendars',
    setUpSubtitle: (name: string) => `Hi ${name}! Let's connect your family calendars.`,
    calendarDesc: 'Family Hub uses two Google Calendars:',
    calFamilyHub: 'shared events (dinners, shows, trips…)',
    calFamilyCar: 'car bookings',
    scanCalendars: 'Scan my Google Calendars',
    enterManually: 'Enter calendar IDs manually',
    scanning: 'Scanning…',
    foundCalendars: '✅ Found your family calendars!',
    connectOpen: 'Connect & Open App',
    noCalendarsFound: 'No existing Family Hub calendars found. Create them now — then share them with your family from Google Calendar.',
    createCalendars: 'Create Family Calendars',
    creating: 'Creating calendars…',
    haveIds: 'I already have calendar IDs',
    familyHubId: 'Family Hub calendar ID',
    familyCarId: 'Family Car calendar ID',
    connect: 'Connect',
    back: '← Back',

    // Nav
    navHome: 'Home',
    navEvents: 'Events',
    navCar: 'Car',
    navSettings: 'Settings',

    // Home
    carTitle: 'Family Car',
    carAvailable: 'Available today',
    carBooked: (name: string, from: string, to: string) => `Booked by ${name} · ${from}–${to}`,
    bookArrow: 'Book →',
    next7Days: 'Next 7 days',
    add: 'Add',
    noEventsComingUp: 'No events coming up',
    addFirstOne: 'Add the first one →',

    // Events
    eventsTitle: 'Events',
    days7: '7 days',
    days30: '30 days',
    months3: '3 months',
    noEventsRange: 'No events in this range',
    scheduleSomething: 'Schedule something →',

    // Car
    carPageTitle: '🚗 Family Car',
    bookCar: 'Book',
    noBookingsWeek: 'No bookings this week',
    bookTheCarArrow: 'Book the car →',

    // Settings
    settingsTitle: 'Settings',
    calendarIdsTitle: 'Calendar IDs',
    familyHubLabel: 'Family Hub (events)',
    familyCarLabel: 'Family Car',
    saveChanges: 'Save changes',
    saved: 'Saved!',
    shareTitle: 'Share with family',
    shareInstructions: 'For other family members to see and add events, share both calendars with them in Google Calendar:',
    shareStep1: 'Open Google Calendar',
    shareStep2: 'Find Family Hub and Family Car in the sidebar',
    shareStep3: 'Click the three-dot menu → Share with specific people',
    shareStep4: "Add each family member's Gmail and give them Make changes to events",
    shareAccessAt: 'They then sign in at',
    language: 'Language',

    // Event Modal
    addEvent: 'Add Event',
    eventTitlePlaceholder: 'Event title…',
    eventType: 'Type',
    allDay: 'All day',
    startDate: 'Start date',
    dateLabel: 'Date',
    endDate: 'End date',
    startTime: 'Start time',
    endTime: 'End time',
    locationPlaceholder: 'Location (optional)',
    notesPlaceholder: 'Notes (optional)',
    addToCalendar: 'Add to Calendar',
    saving: 'Saving…',
    titleRequired: 'Title is required.',
    endAfterStart: 'End time must be after start time.',

    // Booking Modal
    bookCarTitle: '🚗 Book the Car',
    purposePlaceholder: 'Purpose (e.g. School pickup)',
    datePickerLabel: 'Date',
    from: 'From',
    until: 'Until',
    conflict: 'Scheduling conflict!',
    bookAnyway: 'Book anyway',
    bookCarBtn: 'Book Car',
    purposeRequired: 'Purpose is required.',
    endAfterStartBooking: 'End time must be after start time.',

    // Calendar
    calDays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as string[],
    calMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as string[],

    // Date labels
    today: 'Today',
    tomorrow: 'Tomorrow',

    // Delete confirm
    deleteEvent: (title: string) => `Delete "${title}"?`,
    deleteBooking: (purpose: string) => `Delete booking "${purpose}"?`,
  },

  he: {
    appName: 'מרכז המשפחה',
    appSubtitle: 'לוח שנה ומשאבים משפחתיים',
    appPrivacy: 'מרכז המשפחה משתמש ב-Google Calendar לאחסון האירועים. לא נשמרים נתונים מחוץ לחשבון Google שלך.',

    signIn: 'התחבר עם Google',
    signOut: 'התנתק',

    setUpTitle: 'הגדרת לוחות שנה',
    setUpSubtitle: (name: string) => `שלום ${name}! בואו נחבר את לוחות השנה המשפחתיים.`,
    calendarDesc: 'מרכז המשפחה משתמש בשני לוחות שנה של Google:',
    calFamilyHub: 'אירועים משפחתיים (ארוחות, הצגות, טיולים…)',
    calFamilyCar: 'הזמנות רכב',
    scanCalendars: 'סרוק את לוחות השנה שלי',
    enterManually: 'הזן מזהי לוחות שנה ידנית',
    scanning: 'סורק…',
    foundCalendars: '✅ נמצאו לוחות השנה המשפחתיים!',
    connectOpen: 'חבר ופתח את האפליקציה',
    noCalendarsFound: 'לא נמצאו לוחות שנה קיימים. צור אותם עכשיו — ואז שתף אותם עם בני המשפחה.',
    createCalendars: 'צור לוחות שנה משפחתיים',
    creating: 'יוצר לוחות שנה…',
    haveIds: 'יש לי כבר מזהי לוחות שנה',
    familyHubId: 'מזהה לוח שנה – מרכז המשפחה',
    familyCarId: 'מזהה לוח שנה – רכב משפחתי',
    connect: 'חבר',
    back: 'חזרה →',

    navHome: 'בית',
    navEvents: 'אירועים',
    navCar: 'רכב',
    navSettings: 'הגדרות',

    carTitle: 'רכב משפחתי',
    carAvailable: 'פנוי היום',
    carBooked: (name: string, from: string, to: string) => `הוזמן ע"י ${name} · ${from}–${to}`,
    bookArrow: 'הזמן ←',
    next7Days: '7 ימים הקרובים',
    add: 'הוסף',
    noEventsComingUp: 'אין אירועים קרובים',
    addFirstOne: 'הוסף את הראשון ←',

    eventsTitle: 'אירועים',
    days7: '7 ימים',
    days30: '30 ימים',
    months3: '3 חודשים',
    noEventsRange: 'אין אירועים בטווח זה',
    scheduleSomething: 'תכנן משהו ←',

    carPageTitle: '🚗 רכב משפחתי',
    bookCar: 'הזמן',
    noBookingsWeek: 'אין הזמנות השבוע',
    bookTheCarArrow: 'הזמן את הרכב ←',

    settingsTitle: 'הגדרות',
    calendarIdsTitle: 'מזהי לוחות שנה',
    familyHubLabel: 'מרכז המשפחה (אירועים)',
    familyCarLabel: 'רכב משפחתי',
    saveChanges: 'שמור שינויים',
    saved: 'נשמר!',
    shareTitle: 'שיתוף עם המשפחה',
    shareInstructions: 'כדי שבני המשפחה יראו ויוסיפו אירועים, שתף את שני לוחות השנה ב-Google Calendar:',
    shareStep1: 'פתח את Google Calendar',
    shareStep2: 'מצא את "מרכז המשפחה" ו"רכב משפחתי" בסרגל הצד',
    shareStep3: 'לחץ על תפריט שלוש הנקודות ← שתף עם אנשים ספציפיים',
    shareStep4: 'הוסף את הג\'ימייל של כל בן משפחה ותן הרשאת "עריכת אירועים"',
    shareAccessAt: 'הם מתחברים בכתובת',
    language: 'שפה',

    addEvent: 'הוסף אירוע',
    eventTitlePlaceholder: 'שם האירוע…',
    eventType: 'סוג',
    allDay: 'כל היום',
    startDate: 'תאריך התחלה',
    dateLabel: 'תאריך',
    endDate: 'תאריך סיום',
    startTime: 'שעת התחלה',
    endTime: 'שעת סיום',
    locationPlaceholder: 'מיקום (אופציונלי)',
    notesPlaceholder: 'הערות (אופציונלי)',
    addToCalendar: 'הוסף ללוח השנה',
    saving: 'שומר…',
    titleRequired: 'נדרש שם לאירוע.',
    endAfterStart: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה.',

    bookCarTitle: '🚗 הזמן את הרכב',
    purposePlaceholder: 'מטרה (למשל: הסעה לבית ספר)',
    datePickerLabel: 'תאריך',
    from: 'מ-',
    until: 'עד',
    conflict: 'קונפליקט בלוח הזמנים!',
    bookAnyway: 'הזמן בכל זאת',
    bookCarBtn: 'הזמן רכב',
    purposeRequired: 'נדרשת מטרה.',
    endAfterStartBooking: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה.',

    calDays: ['ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\'', 'א\''] as string[],
    calMonths: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'] as string[],

    today: 'היום',
    tomorrow: 'מחר',

    deleteEvent: (title: string) => `למחוק את "${title}"?`,
    deleteBooking: (purpose: string) => `למחוק את ההזמנה "${purpose}"?`,
  },
} as const

export type Strings = typeof strings.en

export function getStrings(lang: Lang): Strings {
  return strings[lang] as unknown as Strings
}
