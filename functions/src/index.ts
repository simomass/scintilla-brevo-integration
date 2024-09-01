/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";

import fetch from 'node-fetch';

import {defineSecret}  from 'firebase-functions/params';

const apiKey = defineSecret('BREVO_API_KEY');

import {
    onDocumentWritten
} from "firebase-functions/v2/firestore";


exports.createBrevoContact = onDocumentWritten("/users/{uid}", (event) => {

    logger.info(`Creating contact from user ${event.params.uid} on Brevo`);

    const url = 'https://api.brevo.com/v3/contacts';
    const email = event.data?.after.get("email");
    const agreedOnNews = event.data?.after.get("agreeOnNews") || false;
    const firstName = event.data?.after.get("name") || "";
    const lastName = event.data?.after.get("surname") || "";
    const phone = event.data?.after.get("telephoneNumber") || "";
    const discountCode = event.data?.after.get("discountCode") || "";

    if (email) {

        const attributes = {
            NOME: firstName,
            COGNOME: lastName,
            TELEFONO: phone,
            CONSENSO: agreedOnNews,
            REFERRAL: discountCode,
        };


        const body = JSON.stringify({
            email,
            attributes/*,
            emailBlacklisted: agreedOnNews,
            smsBlacklisted: agreedOnNews,
            updateEnabled: false,*/
        });


        logger.info(`Email retrieved from Firestore: ${email}`);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                logger.info('Brevo API response:', data);  // Log Brevo API response
            })
            .catch(error => {
                logger.error('Error creating Brevo contact:', error);  // More specific error logging
            });
    } else {
        logger.error('Something went wrong, missing email information')
    }

});
