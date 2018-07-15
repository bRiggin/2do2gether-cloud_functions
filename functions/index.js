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
exports.sendConnectionNotification = functions.database.ref('/connection_requests/{requestedUid}/{requesterUid}')
	.onWrite((change, context) => {
		if (!change.after.exists()) {
			console.log('Triggered by database delete');
        	return null;
      	}
      	const status = change.after.val();
      	const requesterUid = context.params.requesterUid;
      	const requestedUid = context.params.requestedUid;

      	if (status === false){
      		console.log("Connection request submitted.");
      		console.log('sendNotification called: requesterUid ', requesterUid, ' requestedUid: ', requestedUid, ' status: ', status);
	      	// Get the list of device notification tokens.
	      	const deviceToken = admin.database().ref(`/fcm_tokens/${requestedUid}`).once('value');
	      	console.log('deviceToken: ', deviceToken);

	      	// Get the follower profile.
	      	const requesterProfile = admin.auth().getUser(requesterUid);
	      	console.log('requesterProfile: ', requesterProfile);

	      	// The snapshot to the user's tokens.
	      	let tokenSnapshot;

	      	// The array containing all the user's tokens.
	      	let token;

			return Promise.all([deviceToken, requesterProfile]).then(results => {
				tokenSnapshot = results[0];
		        console.log('tokensSnapshot: ', tokenSnapshot);

		        const requester = results[1];
		        console.log('requester: ', requester);

		        token = tokenSnapshot.val();
		        console.log('token: ', token);

		        // Check if there are any device tokens.
		        if (token === null) {
					return console.log('There is no notification token to send to.');
		        }

		        const firstNameToken = admin.database().ref(`/user_profile/${requesterUid}/first_name`).once('value');
		        return Promise.all([firstNameToken, requesterProfile]).then(results => {
					const firstName = results[0].val();

					const secondNameToken = admin.database().ref(`/user_profile/${requesterUid}/second_name`).once('value');
					return Promise.all([secondNameToken, requesterProfile]).then(results => {
						const secondName = results[0].val();

						// Notificaiton payload, does appear that additional informaiton can be sent to
						// that this relevant to the logged in user.
						var payload = {	
							notification: {
								title: 'You have a new connection request!',
								body: `${firstName} ${secondName} wants to connect with you.`
							}
						};
				        console.log('payload', payload);


						// Send notifications to all tokens.
						return admin.messaging().sendToDevice(token, payload)
							.then(function(response){
								return console.log("Successfully sent message: ", response);
					  	})
					  	.catch(function(error){
					    	console.log("Error sending message: ", error);
					  	});
					});		
			  	});				
			});
      	} else if (status === true){
      		// requested sending a notification to the requester

      		console.log("Connection request accepted.");
      		console.log('sendNotification called: requesterUid ', requesterUid, ' requestedUid: ', requestedUid, ' status: ', status);
	      	// Get the list of device notification tokens.
	      	const deviceToken = admin.database().ref(`/fcm_tokens/${requesterUid}`).once('value');
	      	console.log('deviceToken: ', deviceToken);

	      	// Get the follower profile.
	      	const requestedProfile = admin.auth().getUser(requestedUid);
	      	console.log('requestedProfile: ', requestedProfile);

	      	// The snapshot to the user's tokens.
	      	let tokenSnapshot;

	      	// The array containing all the user's tokens.
	      	let token;

			return Promise.all([deviceToken, requestedProfile]).then(results => {
				tokenSnapshot = results[0];
		        console.log('tokensSnapshot: ', tokenSnapshot);

		        const requested = results[1];
		        console.log('requested: ', requested);

		        token = tokenSnapshot.val();
		        console.log('token: ', token);

		        // Check if there are any device tokens.
		        if (token === null) {
					return console.log('There is no notification token to send to.');
		        }

		        const firstNameToken = admin.database().ref(`/user_profile/${requestedUid}/first_name`).once('value');
		        return Promise.all([firstNameToken, requestedProfile]).then(results => {
					const firstName = results[0].val();

					const secondNameToken = admin.database().ref(`/user_profile/${requestedUid}/second_name`).once('value');
					return Promise.all([secondNameToken, requestedProfile]).then(results => {
						const secondName = results[0].val();

						// Notificaiton payload, does appear that additional informaiton can be sent to
						// that this relevant to the logged in user.
						var payload = {	
							notification: {
								title: 'You have a new connection!',
								body: `${firstName} ${secondName} accepted your request.`
							}
						};
				        console.log('payload', payload);


						// Send notifications to all tokens.
						return admin.messaging().sendToDevice(token, payload)
							.then(function(response){
								return console.log("Successfully sent message: ", response);
					  	})
					  	.catch(function(error){
					    	console.log("Error sending message: ", error);
					  	});
					});		
			  	});				
			});
      	} 
	}
);

