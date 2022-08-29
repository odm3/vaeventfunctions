import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { ENVIRONMENT } from "../environment";
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const volunteer = (req.body && req.body.volunteer);
    const { DB_ENDPOINT, DB_NAME, DB_CONTAINER_NAME} = ENVIRONMENT;
    const credential = new DefaultAzureCredential();
    const dbClient = new CosmosClient({
        endpoint: DB_ENDPOINT,
        aadCredentials: credential
    });
    try {
        const { database } = await dbClient.databases.createIfNotExists({id: DB_NAME});
        const { container } = await database.containers.createIfNotExists({ id: DB_CONTAINER_NAME});
        const itemRes = await container.items.upsert(volunteer);
        context.res.json({
            status: itemRes.statusCode
        })
    } catch(error) {
        context.log(`DB Operation error occurred. The reason is ${error}`);
        context.res.json({
            status: error
        })
    }

};

export default httpTrigger;