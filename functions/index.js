/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const capitalizeSentence = require('capitalize-sentence');
const Filter = require('bad-words');
const badWordsFilter = new Filter();

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const fbDbTest1RefUpdate = admin.database().ref('/updates/http');
const fbDbTest2RefUpdate = admin.database().ref('/updates/db');
const fbDbTestRefUpdate = admin.database().ref('/updates');

exports.onDBEntryUpdate = functions.database
  .ref('/test/{testId}').onUpdate(event => {
    const message = event.data.val();

    const promiseDelay1 = message.promiseDelay1;
    const promiseDelay2 = message.promiseDelay2; 
    const sleepDuration = message.sleepDuration;
    const text = message.text;
    console.log('START');
    console.log('Text: ', text);
    console.log('Sleep Duration: ', sleepDuration);
    console.log('Promise Delay 1', promiseDelay1);
    console.log('Promise Delay 2', promiseDelay2);
    
    //really sleep
    console.log('Sleep Start');
    sleep(sleepDuration);
    console.log('Sleep End');

    // testing promise
    console.log('Delay 1', promiseDelay1);
    var delay1 = delay(promiseDelay1).then(() => {
      console.log('In Delay 1 function call: ', promiseDelay1);
      fbDbTest2RefUpdate.update({
        inDBCall1: true
      });
    });
    console.log('Delay 2', promiseDelay2);  
    var delay2 = delay(promiseDelay2).then(() => {
      console.log('In Delay 2 function call: ', promiseDelay2);
      fbDbTest2RefUpdate.update({
        inDBCall2: true
      });
    });  

    Promise.all([delay1, delay2])
      .then(() => {
        return fbDbTest2RefUpdate.update({
          updatedDB: true
        });
      })
      .catch(err => {
        console.error(err);
        return fbDbTest2RefUpdate.update({
          updatedDB: false
        });
      });
  });

exports.doSomethingPromiseWrapped = functions.https.onRequest((req, res) => {
  const promiseDelay1 = req.query.promiseDelay1;
  const promiseDelay2 = req.query.promiseDelay2;
  const sleepDuration = req.query.sleepDuration;
  const text = req.query.text;
  console.log('START');
  console.log('Text: ', text);
  console.log('Sleep Duration: ', sleepDuration);
  console.log('Promise Delay 1', promiseDelay1);
  console.log('Promise Delay 2', promiseDelay2);
  
  //really sleep
  console.log('Sleep Start');
  sleep(sleepDuration);
  console.log('Sleep End');

  // testing promise
  console.log('Delay 1', promiseDelay1);
  var delay1 = delay(promiseDelay1).then(() => {
    console.log('In Delay 1 function call: ', promiseDelay1);
    fbDbTest1RefUpdate.update({
      inHTTPCall1: true
    });
  });
  console.log('Delay 2', promiseDelay2);  
  var delay2 = delay(promiseDelay2).then(() => {
    console.log('In Delay 2 function call: ', promiseDelay2);
    fbDbTest1RefUpdate.update({
      inHTTPCall2: true
    });
  });  

  Promise.all([delay1, delay2])
    .then(() => {
      res.redirect(200, '/');
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });

});

exports.doSomething = functions.https.onRequest((req, res) => {
  const promiseDelay1 = req.query.promiseDelay1;
  const promiseDelay2 = req.query.promiseDelay2;
  const sleepDuration = req.query.sleepDuration;
  const text = req.query.text;
  console.log('START');
  console.log('Text: ', text);
  console.log('Sleep Duration: ', sleepDuration);
  console.log('Promise Delay 1', promiseDelay1);
  console.log('Promise Delay 2', promiseDelay2);
  
  //really sleep
  console.log('Sleep Start');
  sleep(sleepDuration);
  console.log('Sleep End');

  // testing promise
  console.log('Delay 1', promiseDelay1);
  var delay1 = delay(promiseDelay1).then(() => {
    console.log('In Delay 1 function call: ', promiseDelay1);
    fbDbTest1RefUpdate.update({
      inHTTPCall1: true
    });
  });
  console.log('Delay 2', promiseDelay2);  
  var delay2 = delay(promiseDelay2).then(() => {
    console.log('In Delay 2 function call: ', promiseDelay2);
    fbDbTest1RefUpdate.update({
      inHTTPCall2: true
    });
  });  

  Promise.all([delay1, delay2]).then(() => {
    console.log('Promise all done');
  });

  console.log('END')
  res.redirect(200, "/")
});

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e30; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => { 
    setTimeout(resolve, ms);
    console.log('In delay function');
    fbDbTestRefUpdate.update({
      delay: ms,
      inFunction: true
    });
  });
}

exports.updates = functions.database
  .ref('/messages/{messageId}').onUpdate(event => {
    console.log('OnUpdate START');
    const message = event.data.val();
    console.log('message', message)
    console.log('message text', message.text);
    
    const { exec } = require('child_process');
    exec('free -m', (err, stdout, stderr) => {
      if (err) {
        console.log(err, 'err could not execute');
        // node couldn't execute the command
        return;
      }
    
      // the *entire* stdout and stderr (buffered)
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

    // this is needed if we make an update on the return function, so we don't infinite loop the onUpdate event
    if(message.updated == true) {
      return
    }
    const updated = true;
    console.log('OnUpdate END');
    
    return event.data.adminRef.update({
      updated: true
    });

  })

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.moderator = functions.database
  .ref('/messages/{messageId}').onWrite(event => {
    const message = event.data.val();

    if (message && !message.sanitized) {
      // Retrieved the message values.
      console.log('Retrieved message content: ', message);

      // Run moderation checks on on the message and moderate if needed.
      const moderatedMessage = moderateMessage(message.text);

      // Update the Firebase DB with checked message.
      console.log('Message has been moderated. Saving to DB: ', moderatedMessage);
      return event.data.adminRef.update({
        text: moderatedMessage,
        sanitized: true,
        moderated: message.text !== moderatedMessage
      });
    }
  });

// Moderates the given message if appropriate.
function moderateMessage(message) {
  // Re-capitalize if the user is Shouting.
  if (isShouting(message)) {
    console.log('User is shouting. Fixing sentence case...');
    message = stopShouting(message);
  }

  // Moderate if the user uses SwearWords.
  if (containsSwearwords(message)) {
    console.log('User is swearing. moderating...');
    message = moderateSwearwords(message);
  }

  return message;
}

// Returns true if the string contains swearwords.
function containsSwearwords(message) {
  return message !== badWordsFilter.clean(message);
}

// Hide all swearwords. e.g: Crap => ****.
function moderateSwearwords(message) {
  return badWordsFilter.clean(message);
}

// Detect if the current message is shouting. i.e. there are too many Uppercase
// characters or exclamation points.
function isShouting(message) {
  return message.replace(/[^A-Z]/g, '').length > message.length / 2 || message.replace(/[^!]/g, '').length >= 3;
}

// Correctly capitalize the string as a sentence (e.g. uppercase after dots)
// and remove exclamation points.
function stopShouting(message) {
  return capitalizeSentence(message.toLowerCase()).replace(/!+/g, '.');
}
