const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.helloWorld = functions.https.onRequest((request, response) => {
	response.send("hello from firebase cloud fucntions");
});

const APP_NAME = 'Cloud Storage for Firebase quickstart';

// [START sendWelcomeEmail]
/**
 * Sends a welcome email to new user.
 */
// [START onCreateTrigger]
exports.setupUserDbEntires = functions.auth.user().onCreate((user) => {
	const text = "";
	admin.database().ref(`/user_profile/${user.uid}`).update({ first_name: text, second_name: text, nickname: text, discoverable: false});
	admin.database().ref(`/user_settings/${user.uid}`).update({ notification_connection_requests: true, notification_new_connections: true, 
																notification_new_lists: true, notification_new_items: true});
});


// firebase deploy --only functions