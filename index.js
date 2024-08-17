const express = require('express');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');

const app = express();
app.use(bodyParser.json());

// Dialogflow setup
const projectId = 'ChatboxApp'; 
const sessionClient = new SessionsClient();

app.post('/webhook', async (req, res) => {
    const sessionId = req.body.sessionId;
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: req.body.query,
                languageCode: 'en-US',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        // Extract necessary information
        const intent = result.intent.displayName;
        const responsesList = result.fulfillmentMessages.map(msg => msg.text.text).flat();
        const context = result.outputContexts.map(ctx => ctx.name).flat();
        const patterns = result.parameters.fields;

        // Document store
        const document = {
            intent: intent,
            responses: responsesList,
            context: context,
            patterns: patterns,
        };

        // Saving to a file
        const fs = require('fs');
        fs.writeFileSync(`./documents/${intent}.json`, JSON.stringify(document, null, 2));

        // Respond to the user
        res.json({ fulfillmentText: result.fulfillmentText });
    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
