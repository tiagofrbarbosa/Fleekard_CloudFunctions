'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.sendMessageNotification = functions.database.ref('/notification_message/{userRecipient}/{userSender}').onWrite(event => {
  const userSenderUid = event.data.current.child('userUid').val();
  const userToken = event.data.current.child('userToken').val();

  if (!event.data.val()) {
    return console.log('no event data value!');
  }
  
  console.log('userSenderUid: ',userSenderUid);
  console.log('userToken: ',userToken);

  const getSenderProfilePromise = admin.auth().getUser(userSenderUid);

  return Promise.all([getSenderProfilePromise]).then(results => {
    const sender = results[0];

    console.log('Fetched sender profile', sender);

    const payload = {
      notification: {
        title: 'You have a new message!',
        body: `${sender.displayName} sent a message.`,
        sound: `default`,
        badge: `1`
      }
    };

    return admin.messaging().sendToDevice(userToken, payload).then(response => {

      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
      return Promise.all(tokensToRemove);
    });
  });
});