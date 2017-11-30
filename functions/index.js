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

exports.doSomething = functions.https.onRequest((req, res) => {
  const duration = req.query.duration;
  const text = req.query.text;
  console.log('Text: ', text);
  console.log('Sleep: ', duration);
  sleep(duration);
  console.log('Wakeup');
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

exports.updates = functions.database
  .ref('/messages/{messageId}').onUpdate(event => {
    console.log('OnUpdate START');
    const message = event.data.val();
    console.log('message', message)
    console.log('message text', message.text);
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
