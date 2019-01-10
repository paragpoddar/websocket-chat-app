const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
const DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });
const { TABLE_NAME } = process.env;

exports.handler = (event, context, callback) => {
    console.log("Event: ", JSON.stringify(event));
    if (event.requestContext.eventType === "CONNECT") {
        const params = {
            TableName: TABLE_NAME,
            Item: {
                connectionId: { S: event.requestContext.connectionId }
            }
        };
        DDB.putItem(params, (err) => {
            callback(null, {
                statusCode: err ? 500 : 200,
                body: err ? "Failed to connect: " + JSON.stringify(err) : "Connected"
            });
        });
    }
    if (event.requestContext.eventType === "DISCONNECT") {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                connectionId: { S: event.requestContext.connectionId }
            }
        };
        DDB.deleteItem(params, function (err) {
            callback(null, {
                statusCode: err ? 500 : 200,
                body: err ? "Failed to disconnect: " + JSON.stringify(err) : "Disconnected."
            });
        });
    }
};