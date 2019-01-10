const AWS = require("aws-sdk");
require("aws-sdk/clients/apigatewaymanagementapi");
AWS.config.update({ region: process.env.AWS_REGION });
const DDB = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const { TABLE_NAME } = process.env;

exports.handler = async (event) => {
    if (event.requestContext.eventType === "MESSAGE") {
        let connectionData;
        try {
            connectionData = await DDB.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
        } catch (e) {
            return { statusCode: 500, body: e.stack };
        }
        const apiManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: "2018-11-29",
            endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
        });
        const postData = JSON.parse(event.body).data;
        const postCalls = connectionData.Items.map(async ({ connectionId }) => {
            try {
                await apiManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    await DDB.deleteItem({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
                } else {
                    throw e;
                }
            }
        });
        try {
            await Promise.all(postCalls);
        } catch (e) {
            return { statusCode: 500, body: e.stack };
        }
        return { statusCode: 200, body: 'Data sent.' };
    }
};