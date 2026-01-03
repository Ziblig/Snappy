// CLIENT ID
const CLIENT_ID = process.env.GAPI_CLIENT_ID;
// 
const DISCOVERY_DOC = process.env.GAPI_DISCOVERY_DOC;
// ACCESS SCOPE
const SCOPES = process.env.GAPI_SCOPES;

// Дані клієнта(id користувача)
let tokenClient;
// Google API (OK OR NOT)
let gapiInited = false;
// Google Identity Services (OK OR NOT)
let gisInited = false;

// INITIALIZATION OF Google API (Google API Client)
export function gapiLoaded() {
// CLIENT DOWNLOADING GAPI
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log("GAPI Initialized");
    })
}

// INITIALIZATION OF Google Identity Services
export function gisLoaded() {
  // CLIENTS TOKEN INITIALIZATION
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "", 
    });
    gisInited = true;
    console.log("GIS Initialized");
};

// GC SYNC FUNCTION
export async function syncNoteToCalendar(title, description, startIso, endIso = null, location = null) {
    if (!gapiInited || !gisInited) {
        alert("Google API not initialized");
        return null;
    }
    // promise - обєкт, результат асинхронної функції, відповідь (resolve/reject)
    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                reject(resp);
                return;
            }
            // дані відправлені в гугл календар
            const event = {
            'summary': title,
            'description': description,
            'start': { 'dateTime': startIso || new Date().toISOString(), 'timeZone': 'Europe/Prague' },
            'end': { 'dateTime': endIso || new Date(startIso ? new Date(startIso).getTime() + 3600000 : Date.now() + 3600000).toISOString(), 'timeZone': 'Europe/Prague' },
            'location': location || undefined
          };


        try {
          // await: зупиняє виконання асинхроної функції до отримання відповіді (будьякої)
        const response = await gapi.client.calendar.events.insert({
          'calendarId': 'primary',
          'resource': event,
        });
        console.log('Event created in Google:', response.result.id);
        resolve(response.result.id);
        // catch - ловить помилки(reject)
      } catch (err) {
        console.error('Error creating event:', err);
        reject(err);
      }
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

// DELETE EVENT FROM GOOGLE CALENDAR
export async function deleteCalendarEvent(googleEventId) {
  if (!googleEventId) return;

  if (!gapiInited || !gisInited) {
    console.warn('Google API not initialized - cannot delete event');
    return;
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        console.error('Token error while deleting event:', resp);
        reject(resp);
        return;
      }

      try {
        await gapi.client.calendar.events.delete({
          'calendarId': 'primary',
          'eventId': googleEventId,
        });
        console.log('Event deleted from Google Calendar');
        resolve();
      } catch (err) {
        console.error('Error deleting from Google:', err);
        reject(err);
      }
    };

    try {
      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      console.error('Error requesting access token for delete:', err);
      reject(err);
    }
  });
}

// UPDATE EVENT IN GOOGLE CALENDAR
export async function updateCalendarEvent(googleEventId, title, description, startIso, endIso = null, location = null) {
  if (!googleEventId) return null;

  if (!gapiInited || !gisInited) {
    console.warn('Google API not initialized - cannot update event');
    return null;
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }

      const event = {
        'summary': title,
        'description': description,
        'start': { 'dateTime': startIso || new Date().toISOString(), 'timeZone': 'Europe/Prague' },
        'end': { 'dateTime': endIso || new Date(startIso ? new Date(startIso).getTime() + 3600000 : Date.now() + 3600000).toISOString(), 'timeZone': 'Europe/Prague' },
        'location': location || undefined
      };

      try {
        const response = await gapi.client.calendar.events.update({
          'calendarId': 'primary',
          'eventId': googleEventId,
          'resource': event,
        });
        console.log('Event updated in Google:', response.result.id);
        resolve(response.result.id);
      } catch (err) {
        console.error('Error updating event:', err);
        reject(err);
      }
    };

    try {
      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      console.error('Error requesting access token for update:', err);
      reject(err);
    }
  });
}
