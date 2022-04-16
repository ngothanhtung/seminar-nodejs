var express = require('express');
var request = require('request');
var util = require('util');
var router = express.Router();

const VALIDATION_TOKEN = 'thanhtungo';
const PAGE_ACCESS_TOKEN = 'EAAFwWn6bS74BABAt82Vkhg7ZBWYLbEYwdgraw1kmqI9uDYnjvsyqzPE27gvaYiOWRdgdFDS58Jna8ZCUwfxZADJc8K90Q2f8qmCmLQXaZAMIcicuKXZCTKItljB6Q62tg6SVixKlnh297RowZBECZBujZCK6pF1b94KZBIaQ6ZCmJvpUms67AsZAcG2';
const SERVER_URL = 'https://chatbot.aptech.io/facebook';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express (Facebook Chatbot)' });
});

router.get('/api/setPersistentMenu', function (req, res) {
  sendPersistentMenu();
  res.status(200).send('OK');
});

router.get('/api/authorize', function (req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = '1234567890';

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + '&authorization_code=' + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess,
  });
});

router.get('/api/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

router.post('/api/webhook', function (req, res) {
  var data = req.body;
  console.log('==================================================================================================================================');
  console.log(util.inspect(data, { showHidden: true, depth: null }));
  console.log('==================================================================================================================================');
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log('Webhook received unknown messagingEvent: ', messagingEvent);
        }
      });
    });
  }

  res.sendStatus(200);
});

// ===============================================================================================
// private functions
// ===============================================================================================

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log('Received message for user %d and page %d at %d with message:', senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log('Received echo for message %s and app %d with metadata %s', messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log('Quick reply for message %s with payload %s', messageId, quickReplyPayload);

    sendTextMessage(senderID, 'Quick reply tapped');
    return;
  }

  // Xử lý message nhận được
  if (messageText) {
    if (/(hello|hi) (bot|awesomebot)/g.test(messageText)) {
      sendTextMessage(senderID, 'hello');
      return;
    }

    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'gif':
        sendGifMessage(senderID);
        break;

      case 'audio':
        sendAudioMessage(senderID);
        break;

      case 'video':
        sendVideoMessage(senderID);
        break;

      case 'file':
        sendFileMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      case 'quick reply':
        sendQuickReply(senderID);
        break;

      case 'read receipt':
        sendReadReceipt(senderID);
        break;

      case 'typing on':
        sendTypingOn(senderID);
        break;

      case 'typing off':
        sendTypingOff(senderID);
        break;

      case 'account linking':
        sendAccountLinking(senderID);
        break;

      default:
        sendTextMessage(senderID, 'CHATBOT: I have received your message: ' + messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received');
  }
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      console.log('Received delivery confirmation for message ID: %s', messageID);
    });
  }

  console.log('All message before %d were delivered.', watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 'at %d', senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, 'Postback called');
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;

  console.log('Received message read event for watermark %d', watermark);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log('Received account link event with for user %d with status %s ' + 'and auth code %s ', senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: SERVER_URL + '/assets/rift.png',
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: SERVER_URL + '/assets/instagram_logo.gif',
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'audio',
        payload: {
          url: SERVER_URL + '/assets/sample.mp3',
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a video using the Send API.
*/
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'video',
        payload: {
          url: SERVER_URL + '/assets/allofus480.mov',
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a file using the Send API.
*/
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'file',
        payload: {
          url: SERVER_URL + '/assets/test.txt',
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a text message using the Send API.
*/
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
      metadata: 'DEVELOPER_DEFINED_METADATA',
    },
  };

  callSendAPI(messageData);
}

/*
Send a button message using the Send API.
*/
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'This is test text',
          buttons: [
            {
              type: 'web_url',
              url: 'https://www.oculus.com/en-us/rift/',
              title: 'Open Web URL',
            },
            {
              type: 'postback',
              title: 'Trigger Postback',
              payload: 'DEVELOPER_DEFINED_PAYLOAD',
            },
            {
              type: 'phone_number',
              title: 'Call Phone Number',
              payload: '+16505551234',
            },
          ],
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a Structured Message (Generic Message type) using the Send API.
*/
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: 'rift',
              subtitle: 'Next-generation virtual reality',
              item_url: 'https://www.oculus.com/en-us/rift/',
              image_url: SERVER_URL + '/assets/rift.png',
              buttons: [
                {
                  type: 'web_url',
                  url: 'https://www.oculus.com/en-us/rift/',
                  title: 'Open Web URL',
                },
                {
                  type: 'postback',
                  title: 'Call Postback',
                  payload: 'Payload for first bubble',
                },
              ],
            },
            {
              title: 'touch',
              subtitle: 'Your Hands, Now in VR',
              item_url: 'https://www.oculus.com/en-us/touch/',
              image_url: SERVER_URL + '/assets/touch.png',
              buttons: [
                {
                  type: 'web_url',
                  url: 'https://www.oculus.com/en-us/touch/',
                  title: 'Open Web URL',
                },
                {
                  type: 'postback',
                  title: 'Call Postback',
                  payload: 'Payload for second bubble',
                },
              ],
            },
          ],
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a receipt message using the Send API.
*/
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = 'order' + Math.floor(Math.random() * 1000);

  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          recipient_name: 'Peter Chang',
          order_number: receiptId,
          currency: 'USD',
          payment_method: 'Visa 1234',
          timestamp: '1428444852',
          elements: [
            {
              title: 'Oculus Rift',
              subtitle: 'Includes: headset, sensor, remote',
              quantity: 1,
              price: 599.0,
              currency: 'USD',
              image_url: SERVER_URL + '/assets/riftsq.png',
            },
            {
              title: 'Samsung Gear VR',
              subtitle: 'Frost White',
              quantity: 1,
              price: 99.99,
              currency: 'USD',
              image_url: SERVER_URL + '/assets/gearvrsq.png',
            },
          ],
          address: {
            street_1: '1 Hacker Way',
            street_2: '',
            city: 'Menlo Park',
            postal_code: '94025',
            state: 'CA',
            country: 'US',
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.0,
            total_tax: 57.67,
            total_cost: 626.66,
          },
          adjustments: [
            {
              name: 'New Customer Discount',
              amount: -50,
            },
            {
              name: '$100 Off Coupon',
              amount: -100,
            },
          ],
        },
      },
    },
  };

  callSendAPI(messageData);
}

/*
Send a message with Quick Reply buttons.
*/
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          content_type: 'text',
          title: 'Action',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION',
        },
        {
          content_type: 'text',
          title: 'Comedy',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY',
        },
        {
          content_type: 'text',
          title: 'Drama',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA',
        },
      ],
    },
  };

  callSendAPI(messageData);
}

/*
Send a read receipt to indicate the message has been read
*/
function sendReadReceipt(recipientId) {
  console.log('Sending a read receipt to mark message as seen');

  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: 'mark_seen',
  };

  callSendAPI(messageData);
}

/*
Turn typing indicator on
*/
function sendTypingOn(recipientId) {
  console.log('Turning typing indicator on');

  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: 'typing_on',
  };

  callSendAPI(messageData);
}

/*
Turn typing indicator off
*/
function sendTypingOff(recipientId) {
  console.log('Turning typing indicator off');

  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: 'typing_off',
  };

  callSendAPI(messageData);
}

/*
Send a message with the account linking call-to-action
*/
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'Welcome. Link your account.',
          buttons: [
            {
              type: 'account_link',
              url: 'https://chatbot.aptech.io/api/authorize',
            },
          ],
        },
      },
    },
  };

  callSendAPI(messageData);
}

function sendPersistentMenu() {
  var options = {
    method: 'POST',
    url: 'https://graph.facebook.com/v13.0/me/messenger_profile',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
    },
    body: {
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: false,
          call_to_actions: [
            {
              title: 'Payay Bill',
              type: 'postback',
              payload: 'PAYBILL_PAYLOAD',
            },
            {
              title: 'History',
              type: 'postback',
              payload: 'HISTORY_PAYLOAD',
            },
            {
              title: 'Contact Info',
              type: 'postback',
              payload: 'CONTACT_INFO_PAYLOAD',
            },
            {
              type: 'web_url',
              title: 'Latest News',
              url: 'https://aptech-danang.edu.vn',
              webview_height_ratio: 'full',
            },
          ],
        },
      ],
    },
    json: true,
  };

  request(options, function (error, response, body) {
    if (error) console.log(error);
    console.log(body);
  });
}

function callSendAPI(messageData) {
  request(
    {
      uri: 'https://graph.facebook.com/v13.0/me/messages',
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: messageData,
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var recipientId = body.recipient_id;
        var messageId = body.message_id;

        if (messageId) {
          console.log('Successfully sent message with id %s to recipient %s', messageId, recipientId);
        } else {
          console.log('Successfully called Send API for recipient %s', recipientId);
        }
      } else {
        console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
      }
    },
  );
}

module.exports = router;
