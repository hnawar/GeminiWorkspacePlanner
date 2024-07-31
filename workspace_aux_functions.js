
/**
 * Fetches meetings from the primary calendar within a specified timeframe.
 *
 * @param {number} days - The number of days in the past or future to fetch meetings for.
 * @param {string} timeframe - Either "past" or "future" indicating the time direction.
 * @param {string} name - (Optional) The name of a user that should be present in the meeting.
 * @returns {Array} An array of meeting events.
 */
function getMeetingsFast(days, timeframe, name) {
  const calendarId = 'primary';
  const now = new Date();
  let startTime, endTime;
  if (timeframe == "past") {
    startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    console.log (`Start time of past is ${startTime}`)
    endTime = now;
  } else if (timeframe == "future") {
    startTime = now;
    endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    console.log (`End time of future is ${endTime}`)
  } else {
    throw new Error("Invalid timeframe. Use 'past' or 'future'.");
  }
  console.log ("Fetching Events from Calendar")


  const events = Calendar.Events.list(calendarId, {
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250
  });
  if (!events.items || events.items.length === 0) {
    console.log('No events found.');
    return;
  }
   console.log ("Found "+ events.items.length +" events")

  var meeting_text = "";

  for (const event of events.items) {
    //console.log(event)
    var status = event.status
    var agenda = event.description
    
    if (event.attendees && event.attendees.length > 1){
      for (const attendee of event.attendees) {
        if (attendee.displayName == name && attendee.responseStatus) {
          status = attendee.responseStatus
        }
      }
    }

    //console.log ("Status of " + event.summary +" is: " + status)


    if (status == "accepted" || status == "tentative" || status == "OWNER" || status == "confirmed") {

      // if meeting has no agenda and no attendee it does not count
      if(!agenda && !event.attendees){
        
      } else {

      meeting_text += "\n \n Meeting Title: " + event.summary + "\n";
      meeting_text += " Attendee emails: " + event.creator.email; + ", " + event.attendees.map(guest => guest.email).join(", ")  + "\n ";
      meeting_text += " Attendee names: " + event.attendees.map(guest => guest.displayName).join(", ")  + "\n ";
      meeting_text += " Meeting Agenda: " + agenda + "\n";

      }
    }
  }
  //console.log(meeting_text);

  return meeting_text;

}

/**
 * Retrieves the last N priority inbox threads and returns their details as a concatenated string.
 *
 * @param {number} N The number of priority inbox threads to retrieve.
 * @return {string} A string containing the details of the retrieved email threads.
 */
function getLastNPriorityInboxThreads(N) {
  var threads = GmailApp.getPriorityInboxThreads(0, N); 

  var emailString = "";  // Initialize an empty string to store email details

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();

    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];

      // Append email details to the string
      emailString += "Subject: " + message.getSubject() + "\n";
      emailString += " From: " + message.getFrom() + "\n";
      emailString += " Date: " + message.getDate() + "\n";
      emailString += " Body: " + message.getPlainBody() + "\n\n"; // Add extra newlines for separation
    }
  }

  return emailString; // Return the concatenated string of email details
}

/**
 * Fetches important email threads from Gmail within a specified number of days.
 * 
 * @param {number} numDays - Number of days to look back for important emails (default: 10).
 * @returns {string} - A formatted string containing details of important email threads.
 */
function getImportantEmailThreads(numDays=10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numDays);
  const searchQuery = `is:important after:${startDate.getFullYear()}/${startDate.getMonth() +1 }/${startDate.getDate()}`;
  console.log("SEARCH QUERY: " +searchQuery)
  const threads = GmailApp.search(searchQuery);
  let emailThreadsString = "";

  for (const thread of threads) {
    const messages = thread.getMessages();

    // Add thread details
    console.log("processing email: " +thread.getFirstMessageSubject())
    emailThreadsString += "Thread Subject: " + thread.getFirstMessageSubject() + "\n\n";
    for (const message of messages) {
      emailThreadsString += "Subject: " + message.getSubject() + "\n";
      emailThreadsString += "From: " + message.getFrom() + "\n";
      emailThreadsString += "Date: " + message.getDate() + "\n";
      emailThreadsString += "Body: " + message.getPlainBody() + "\n\n";
    }
    emailThreadsString += "---\n\n"; // Separator between threads
  }

  return emailThreadsString;
}

/**
 * Extracts text from Google Docs within a specified character range.
 * 
 * @param {Array<string>} docIds - Array of Google Docs IDs.
 * @param {number} startChar - Starting character index for extraction.
 * @param {number} endChar - Ending character index for extraction.
 * @returns {string} - Concatenated text extracted from the documents.
 */
function extractTextFromDocs(docIds, startChar, endChar) {
  let concatenatedText = "";

  for (let i = 0; i < docIds.length; i++) {
    let doc = DocumentApp.openById(docIds[i]);
    let title = doc.getName(); // Get the document title
    let body = doc.getBody();

    // Get all the text content
    let text = body.getText();

    // Extract only a substring of characters
    let extractedText = text.substring(startChar, endChar);

    // Concatenate the title, extracted text, and delimiters
    concatenatedText += "START OF NEW DOCUMENT: " + title + "\n"; 
    concatenatedText += extractedText;
    concatenatedText += "\n. END OF THIS DOCUMENT \n \n";
  }

  return concatenatedText;
}

/**
 * Lists all incomplete tasks from Google Tasks.
 * 
 * @returns {string} - A formatted string containing details of incomplete tasks.
 */
function list_the_tasks(){
  const taskLists = Tasks.Tasklists.list();
  if (!taskLists.items) {
    console.log('No task lists found.');
    return;
  }
  var large_task_string = ""
  for (let i = 0; i < taskLists.items.length; i++) {
    var taskListId = taskLists.items[i].id;
    const tasks = Tasks.Tasks.list(taskListId);
    for (let j = 0; j < tasks.items.length; j++) {
      const task = tasks.items[j];
      // console.log(taskLists.items[i].title)
      console.log(task.title)
      if (!task.completed){
        large_task_string  += "Task title: " +task.title + "\n Details: " + task.notes + "\n Due on: " + task.due + "\n \n";
      }
    }
  }
  return large_task_string
}

