/**
 * Sends up to 5 drafts using the Advanced Gmail API,
 * but only if local time is between 20:00 and 23:59.
 */
function sendDraftsBatch() {
  const now = new Date();
  const hour = now.getHours();
  // // only run between 20:00 and 23:59
  // if (hour < 20 || hour > 23) return;
  // const hour = new Date().getHours();
  // Only run between 20:00 and 03:59
  if (!(hour >= 18 || hour <= 01)) return;


  // list up to 5 drafts
  const res = Gmail.Users.Drafts.list('me', {
    maxResults: 5
  });
  if (!res.drafts) return;

  res.drafts.forEach(draft => {
    // send each draft by ID
    Gmail.Users.Drafts.send({ id: draft.id }, 'me');
  });
}

/**
 * (Re)creates the time-based trigger so sendDraftsBatch()
 * runs every 30 minutes.
 */
function createTrigger() {
  // delete existing sendDraftsBatch triggers
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendDraftsBatch')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // create new every-30-minutes trigger
  ScriptApp.newTrigger('sendDraftsBatch')
    .timeBased()
    .everyMinutes(30)
    .create();
}
