const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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


// firebase deploy --only functions// Declaration of function. "Notifications" can be change to already exisiting function
// so that all required information can be grabbed.
exports.sendNotification = functions.database.ref('/connection_requests/{requestedUid}/{requesterUid}')
    .onWrite((change, context) => {
      const requesterUid = context.params.requesterUid;
      const requestedUid = context.params.requestedUid;
      console.log('sendNotification called: requesterUid ', requesterUid, ' requestedUid: ', requestedUid);

      // Get the list of device notification tokens.
      const deviceToken = admin.database().ref(`/fcm_tokens/${requestedUid}`).once('value');
      console.log('deviceToken: ', deviceToken);

      // Get the follower profile.
      const getRequesterProfilePromise = admin.auth().getUser(requesterUid);
      console.log('getRequesterProfilePromise: ', getRequesterProfilePromise);

      // The snapshot to the user's tokens.
      let tokensSnapshot;

      // The array containing all the user's tokens.
      let tokens;

	      return Promise.all([deviceToken, getRequesterProfilePromise]).then(results => {
	        tokensSnapshot = results[0];
	        console.log('tokensSnapshot: ', tokensSnapshot);

	        const requester = results[1];
	        console.log('requester: ', requester);

	        // Check if there are any device tokens.
	        //if (!tokensSnapshot.hasChildren()) {
	        //  return console.log('There are no notification tokens to send to.');
	        //}
	        console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
	        console.log('Fetched follower profile', requester);

	        // Listing all tokens as an array.
	        //tokens = Object.keys(tokensSnapshot.val());
	        tokens = tokensSnapshot.val();

			// Notificaiton payload, does appear that additional informaiton can be sent to
			// that this relevant to the logged in user.
			var payload = {	
			data:{
				username: "users_username",
				email: "users_email"
			},
			notification: {
				title: 'You have a new follower!',
				body: `${requester.displayName} is now following you.`
			}
			};

	        console.log('tokens: ', tokens);
	        console.log('tokensSnapshot.val(): ', tokensSnapshot.val());
	        console.log('payload', payload);


		// Send notifications to all tokens.
		return admin.messaging().sendToDevice(tokens, payload)
		  .then(function(response){
		    return console.log("Successfully sent message: ", response);
		  })
		  .catch(function(error){
		    console.log("Error sending message: ", error);
		  });
	});
});