/**
* Responds to an ADDED_TO_SPACE event in Google Chat.
* @param {object} event the event object from Google Chat
* @return {object} JSON-formatted response
* @see https://developers.google.com/chat/reference/message-formats/events
*/

function onAddToSpace(event) {
  console.info(event);
  var message = 'Thank you for adding me to ';
  if (event.space.type === 'DM') {
    message += 'a DM, ' + event.user.displayName + '!';
  } else {
    message += event.space.displayName;
  }
  console.log('Attendance Bot added in ', event.space.name);
  return { text: message };
}

/**
* Responds to a REMOVED_FROM_SPACE event in Google Chat.
* @param {object} event the event object from Google Chat
* @see https://developers.google.com/chat/reference/message-formats/events
*/
function onRemoveFromSpace(event) {
  console.info(event);
  console.log('Bot removed from ', event.space.name);
}

var DEFAULT_IMAGE_URL = 'https://goo.gl/bMqzYS';
var HEADER = {
  header: {
    title : 'Weekly Planner',
    subtitle : 'Plan Your Week!',
    imageUrl : DEFAULT_IMAGE_URL
  }
};



/**
 * Creates a card-formatted response.
 * @param {object} widgets the UI components to send
 * @return {object} JSON-formatted response
 */
function createCardResponse(card_sections) {
  return {
    cardsV2: [{
      card: 
      {
        HEADER, 
        sections: card_sections
      }
    }]
  };
}


/**
 * Responds to a MESSAGE event triggered in Google Chat.
 * @param {object} event the event object from Google Chat
 * @return {object} JSON-formatted response
 */
function onMessage(event) {
  console.info(event);
  var name = event.user.displayName;
  var userMessage = event.message.text;
 


  var sections = [
    {
      "widgets": [
        {"textParagraph": {
          "text": 'Hello, ' + name + '.<br>Are you ready to plan your week?'
          }
        }
      ]
    },
    {
      "header": "Config Input data",
      "collapsible": true,
      "widgets": [
        ,{
          "selectionInput": {
            "name": "includedUserData",
            "label": "Select which data to include",
            "type": "SWITCH",
            "items": [
              {
                "text": "Priority Inbox",
                "value": "email",
                "selected": true
              },
              {
                "text": "Tasks",
                "value": "tasks",
                "selected": true
              },
              {
                "text": "Calendar Events",
                "value": "agenda",
                "selected": true
              }
            ]
          }
        },
        {
          "textInput": {
          "name": 'pastDays',
          "label": 'Past Days to Include',
          "value": "7"
          }
        },
        {
          "textInput": {
          "name": 'futureDays',
          "label": 'Future Days to Include',
          "value": "7"
          }
        },{
          textParagraph: {
          "text": 'To include meeting notes, Please add document ids below separated by a comma'
          }
        },
        {
          "textInput": {
          "name": 'notes_docs',
          "label": 'meeting notes docs ids'
          }
        },{
          "buttonList": {
            "buttons": [
          ,   {
                "text": "Prepare User Data",
                "onClick": {
                  "action": {
                    "function": "prepUserData",
                    "parameters": [
                      
                    ]
                  }
                }
              },{
                "text": "Clear Cache",
                "onClick": {
                  "action": {
                    "function": "clearCache",
                    "parameters": [
                      
                    ]
                  }
                }
              }
            ]
          }
        }

      ] 
    },
    {
      "header": "Actions",
      "widgets": [
        {
          "textInput": {
          "name": 'instructions',
          "label": 'Additional instructions for Gemini'
          }
        },
        {
          "buttonList": {
            "buttons": [
              {
                "text": "Custom instructions",
                "onClick": {
                  "action": {
                    "function": "customAction",
                    "parameters": [
                      
                    ]
                  }
                }
              },
              {
                "text": "Plan my Week",
                "onClick": {
                  "action": {
                    "function": "planWeekAhead",
                    "parameters": [
                      
                    ]
                  }
                }
              },
              {
                "text": "Summarise last week",
                "onClick": {
                  "action": {
                    "function": "summeriseLastWeek",
                    "parameters": [
                      
                    ]
                  }
                }
              },
              {
                "text": "Suggest meeting Agendas",
                "onClick": {
                  "action": {
                    "function": "suggestAgenda",
                    "parameters": [
                      
                    ]
                  }
                }
              }
            ]
          }
        }
      ]
    }
    
    ];
  return createCardResponse(sections);
}


/**
 * Responds to a CARD_CLICKED event triggered in Google Chat.
 * @param {object} event the event object from Google Chat
 * @return {object} JSON-formatted response
 * @see https://developers.google.com/chat/reference/message-formats/events
*/

function onCardClick(event) {
  console.info(event);
  var name = event.user.displayName;
  var cache = CacheService.getScriptCache();

  if (event.action.actionMethodName=="clearCache")
  {
    cache.removeAll(['email','pastMeetings', 'fututeMeetings', 'tasks', 'notes'])
    return { text: "Cached cleared" };
  }
  
  var userData = ""
  if (event.common.formInputs.includedUserData[""].stringInputs.value.indexOf("email")!== -1){
    console.log ("Please wait while I fetch relevant meetings, notes and emails ...")
    var emails =""
    if (cache.get('email'))
    {
      emails = cache.get('email')
    }else{
      emails = getImportantEmailThreads(event.common.formInputs.pastDays[""].stringInputs.value[0])
      cache.put('email',emails)
    }
    userData = userData + "\n Here is a record of emails that are relevant during the last week: \n" + emails +  "\n  END OF EMAIL RECORDS. \n"
    console.log(emails)
    console.log("Done fetching emails")
  }
  
  if (event.common.formInputs.includedUserData[""].stringInputs.value.indexOf("agenda")!== -1){
    
    var pastDays = event.common.formInputs.pastDays[""].stringInputs.value[0]  
    var futureDays = event.common.formInputs.futureDays[""].stringInputs.value[0]

    var past_meetings = ""
    if (cache.get('pastMeetings')){
      past_meetings = cache.get('pastMeetings')
    }else{
      past_meetings = getMeetingsFast(pastDays, "past", name)
      cache.put('pastMeetings', past_meetings)
    }
    
    console.log("Done fetching pasts")
    console.log(past_meetings)
  
    var future_meetings = ""
    if (cache.get('futureMeetings')){
      past_meetings = cache.get('futureMeetings')
    }else{
      future_meetings = getMeetingsFast(pastDays, "future", name)
      cache.put('futureMeetings', future_meetings)
    }
    console.log("Done fetching future")
    console.log(future_meetings)
    userData = userData + "Here is a record of past meeting titles and agendas: \n" + past_meetings + "\n END OF PAST MEETING RECORDS. \n \n Here are my future meetings: \n" + future_meetings + "\n END OF FUTURE MEETINGS. \n"
  }
  
  if (event.common.formInputs.notes_docs[""].stringInputs.value[0]){
    notes_docs = event.common.formInputs.notes_docs[""].stringInputs.value[0].split(',')
    
    console.log (notes_docs)
    var notes = ""
    if (cache.get('notes')){
      notes = cache.get('notes')
    } else{
      notes = extractTextFromDocs(notes_docs, 0, 4000)
      cache.put('notes', notes)
    }
    userData = userData + "Here are the most important notes for my customers - consider only the most recent notes and recent meetings: \n " + notes +  "\n END OF CUSTOMER NOTES. \n"
  
    console.log("Done fetching Notes")
    console.log(notes)
  }
  if (event.common.formInputs.includedUserData[""].stringInputs.value.indexOf("tasks")!== -1){
    var myTasks = ""
    if (cache.get('tasks')){
      myTasks = cache.get('tasks')
    }else{
      myTasks = list_the_tasks()
      cache.put('tasks',myTasks)
    }
    console.log(myTasks)
    userData = userData + "\n Here are my Tasks : \n "+ myTasks  + "\n END OF TASKS. \n"
  }
  
  if (event.action.actionMethodName=="prepUserData")
  {
    return { text: "User Data is now Cached" };
  }

  var userIdentity = "I am " + name + " a Sales Engineer working for Google Cloud. My overall goal is too keep my customers happy and making sure they can use our products"

  var customPrompt = event.common.formInputs.instructions[""].stringInputs.value[0]
  
  var agentIdentity = ""
   
  var instructions = buildInstruction (event.action.actionMethodName, userData, userIdentity, agentIdentity, customPrompt)
  
  console.log("THE FINAL INSTRUCTIONS: \n")
  console.log(instructions)

  var message = TalkToGemini(instructions);
  
  return { text: message };
}

 
