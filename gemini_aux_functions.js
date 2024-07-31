function TalkToGemini(text) {
  // --- GCP Gemini API Call ---
 
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent';
  const apiKey = PropertiesService.getScriptProperties().getProperty('api_key'); // retrieve API Key set in "Script Properties" under "Project Settings"
  const url = `${apiUrl}?key=${apiKey}`;

 var headers = {
    "Content-Type": "application/json"
    };

  var requestBody = {
      "contents": [
        {
          "parts": [
            { "text": `${text}`}
          ] 
        }
      ]
    }; 

  var options = {
    "method": "POST",
    "headers": headers,
    "payload": JSON.stringify(requestBody)
  }

 try {
    var response = UrlFetchApp.fetch(url, options);
    var data = JSON.parse(response.getContentText());

    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
         var output = data.candidates[0].content.parts[0].text; 
        //  Logger.log(output);
         return output;
     } else {
         Logger.log("Unexpected Response Structure. Check logs for details.");
         return "Error: Unexpected data from API."; 
     }

  } catch (error) {
    Logger.log(`Error encountered: ${error.message}`); 
    return "An error occurred. Please check the logs."; 
  }
}

function buildInstruction (actionMethodName, userData, userIdentity, agentIdentity, customPrompt) {
    console.log(`action:${actionMethodName} \n userdata: ${userData} \n userIdentity: ${userIdentity}`)
    var agentIdentityConcat = agentIdentity
    var agentInstructionsConcat = customPrompt

    if (actionMethodName == "planWeekAhead") {
        agentIdentityConcat = agentIdentity + " You are a helpful executive assistant who is helping me plan my week and actions I need to take the coming week";
        agentInstructionsConcat = " Create a series of action items I need to work on during the next week. Make sure I follow up on the most important items in the emails, document notes, tasks, and meetings I’ve shared with you, and future meetings next week. Also highlight if I need to write to someone or book a meeting with someone to solve an issue. \n" + customPrompt;
    } else if (actionMethodName == "summariseLastWeek"){
        agentIdentityConcat = agentIdentity + " You are a helpful executive assistant who is helping me report my work to my manager"
        agentInstructionsConcat = " Look into the information I have past about my Emails, Meetings, and Note Documents, and write a summary of the work that I've been doing. Organise it into two discting categories: Internal and Customer Facing \n" + customPrompt
    } else if (actionMethodName == "suggestAgenda"){
        agentIdentityConcat = agentIdentity + " You are a helpful executive assistant who is helping me plan my future meetings next week and write agendas for them"
        agentInstructionsConcat = " Look into the information I have past about my Emails, Meetings, and Note Documents, and looking into my future meetings suggest agendas that appropirate to those meetings based on the participants and the outstanding issues mentioned in the emails, documents, tasks, and previous meetings\n" + customPrompt;
    } else { // then it's a custom prompt
        // in case the user has not provided an identity to the agent
        if (!agentIdentity){
            agentIdentityConcat = "You are a helpful executive assistant who has access to my calendar, meetings, emails, and tasks and helps me plan my work"
        }
        // in case the user has not provided custom prompt
        if (!customPrompt){
            agentInstructionsConcat = "Create a series of action items I need to work on during the next week. Make sure I follow up on the most important items in the emails, document notes, tasks, and meetings I’ve shared with you, and future meetings next week. Also highlight if I need to write to someone or book a meeting with someone to solve an issue."
        } 
    } // end of handling customPrompt
    
    const full_instructions = agentIdentityConcat + "\n " + userIdentity +  "\n \n" + userData + "\n \n" +  "Here are your instructions: " + agentInstructionsConcat + " \n "
    return full_instructions;
}
