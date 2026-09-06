import { FILTER_ALL, REQUEST_STATUS } from "./constants";

const translations = {
  en: {
    languageAria: "Select language",
    appName: "QueenB",
    mockUserName: "Dana Cohen",
    mockUserRole: "Mentee",
    home: "Home",
    back: "Back",
    myRequests: "My Requests",
    myRequestsSubtitle:
      "Track your mentoring requests and continue matching when a mentor responds.",
    requestDetails: "Request details",
    requestDetailsSubtitle: (mentorName) =>
      `Mentoring request with ${mentorName}`,
    viewRequest: "View request",
    requestedOn: (date) => `Requested ${date}`,
    meetingOn: (dateTime) => `Meeting ${dateTime}`,
    mentorFallback: "Mentor",
    filterAria: "Filter requests by status",
    filters: {
      [FILTER_ALL]: "All",
      [REQUEST_STATUS.PENDING_MENTOR]: "Waiting for mentor",
      [REQUEST_STATUS.PENDING_MENTEE]: "Choose a time",
      [REQUEST_STATUS.MATCHED]: "Matched",
      [REQUEST_STATUS.REJECTED]: "Declined",
    },
    loadingRequests: "Loading requests…",
    loadingRequest: "Loading request…",
    loadRequestsError: "Could not load your requests. Please try again.",
    loadRequestError: "Could not load this request. Please try again.",
    requestNotFound: "This request could not be found.",
    requestNotFoundShort: "Request not found.",
    backToMyRequests: "Back to My Requests",
    emptyTitle: "No requests here yet",
    emptyAll:
      "When you send a mentoring request, it will show up on this list.",
    emptyFiltered: "Try another status filter to see more requests.",
    pendingMentorTitle: "Waiting for your mentor",
    pendingMentorDescription:
      "Your request was sent. The mentor will suggest available meeting times soon. Check back here once they respond.",
    pendingMenteeTitle: "Choose a meeting time",
    pendingMenteeDescription:
      "Your mentor shared a few available slots. Pick the time that works best for you, or ask for more options once.",
    suggestedTimes: "Suggested times",
    confirmPreferredTime: "Confirm preferred time",
    requestMoreTimes: "Request more times",
    moreTimesAlreadyRequested: "More times already requested",
    moreTimesHint:
      "You’ve already asked for additional times for this request.",
    matchedTitle: "Meeting scheduled",
    matchedDescription:
      "You’re matched! Your mentoring session is confirmed for the time below.",
    scheduledMeeting: "Scheduled meeting",
    rejectedTitle: "Mentor declined",
    rejectedDescription:
      "This mentor declined your mentoring request. You can explore other mentors and send a new request when you’re ready.",
    selectSuccess:
      "Your preferred time was confirmed. The meeting is now scheduled.",
    selectError: "Could not confirm the selected time.",
    moreTimesSuccess:
      "We asked your mentor for more times. You can only do this once per request.",
    moreTimesError: "Could not request more times.",
  },
  he: {
    languageAria: "בחירת שפה",
    appName: "QueenB",
    mockUserName: "דנה כהן",
    mockUserRole: "מנטית",
    home: "דף הבית",
    back: "חזרה",
    myRequests: "הבקשות שלי",
    myRequestsSubtitle:
      "עקבי אחרי בקשות המנטורינג שלך והמשיכי בהתאמה כשהמנטורית מגיבה.",
    requestDetails: "פרטי הבקשה",
    requestDetailsSubtitle: (mentorName) => `בקשת מנטורינג עם ${mentorName}`,
    viewRequest: "צפייה בבקשה",
    requestedOn: (date) => `נשלחה ב־${date}`,
    meetingOn: (dateTime) => `פגישה ${dateTime}`,
    mentorFallback: "מנטורית",
    filterAria: "סינון בקשות לפי סטטוס",
    filters: {
      [FILTER_ALL]: "הכול",
      [REQUEST_STATUS.PENDING_MENTOR]: "ממתינה למנטורית",
      [REQUEST_STATUS.PENDING_MENTEE]: "בחירת מועד",
      [REQUEST_STATUS.MATCHED]: "הותאמה",
      [REQUEST_STATUS.REJECTED]: "נדחתה",
    },
    loadingRequests: "טוענת בקשות…",
    loadingRequest: "טוענת בקשה…",
    loadRequestsError: "לא ניתן לטעון את הבקשות. נסי שוב.",
    loadRequestError: "לא ניתן לטעון את הבקשה. נסי שוב.",
    requestNotFound: "הבקשה לא נמצאה.",
    requestNotFoundShort: "הבקשה לא נמצאה.",
    backToMyRequests: "חזרה לבקשות שלי",
    emptyTitle: "אין כאן בקשות עדיין",
    emptyAll: "כשתשלחי בקשת מנטורינג, היא תופיע ברשימה הזו.",
    emptyFiltered: "נסי סינון סטטוס אחר כדי לראות בקשות נוספות.",
    pendingMentorTitle: "ממתינים למנטורית",
    pendingMentorDescription:
      "הבקשה נשלחה. המנטורית תציע מועדים פנויים בקרוב. כדאי לחזור לכאן אחרי שהיא תגיב.",
    pendingMenteeTitle: "בחירת מועד לפגישה",
    pendingMenteeDescription:
      "המנטורית הציעה כמה מועדים. בחרי את הזמן שהכי מתאים לך, או בקשי מועדים נוספים פעם אחת.",
    suggestedTimes: "מועדים מוצעים",
    confirmPreferredTime: "אישור המועד המועדף",
    requestMoreTimes: "בקשת מועדים נוספים",
    moreTimesAlreadyRequested: "כבר ביקשת מועדים נוספים",
    moreTimesHint: "כבר ביקשת מועדים נוספים עבור הבקשה הזו.",
    matchedTitle: "הפגישה נקבעה",
    matchedDescription: "יש התאמה! מפגש המנטורינג אושר למועד שלמטה.",
    scheduledMeeting: "פגישה מתוכננת",
    rejectedTitle: "המנטורית דחתה",
    rejectedDescription:
      "המנטורית דחתה את בקשת המנטורינג. אפשר לחפש מנטוריות אחרות ולשלוח בקשה חדשה כשתהיי מוכנה.",
    selectSuccess: "המועד המועדף אושר. הפגישה נקבעה.",
    selectError: "לא ניתן לאשר את המועד שנבחר.",
    moreTimesSuccess:
      "ביקשנו מהמנטורית מועדים נוספים. אפשר לעשות זאת רק פעם אחת לכל בקשה.",
    moreTimesError: "לא ניתן לבקש מועדים נוספים.",
  },
};

export default translations;
