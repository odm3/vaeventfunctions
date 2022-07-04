import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { _CONSTANTS_ } from "../Constants";
import { setLogLevel } from "@azure/logger";

setLogLevel("info");

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const credential = new DefaultAzureCredential();
    const url = _CONSTANTS_.KEYVAULT_URL || "";
    const client = new SecretClient(url, credential);
    const secret = await client.getSecret(_CONSTANTS_.SECRET_NAME);
    return context.res.json({
        secret: secret
    });

};

export default httpTrigger;