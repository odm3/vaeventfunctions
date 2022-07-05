import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { _CONSTANTS_ } from "../Constants";
import fetch from "node-fetch";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const credential = new DefaultAzureCredential();
    const url = _CONSTANTS_.KEYVAULT_URL || "";
    const client = new SecretClient(url, credential);
    const secret = await client.getSecret(_CONSTANTS_.SECRET_NAME);
    const REURL = _CONSTANTS_.ROBOTEVENTSURL || "";
    const headers = {
        'Authorization': `Bearer ${secret.value}`
     };
     const fetchArrays = _CONSTANTS_.SEASON_IDS.map((id) => {
        return fetch(`${REURL}/${id}/events?per_page=${_CONSTANTS_.PAGE_LIMIT}`, { headers });
     });
     const result = await ( await Promise.all(fetchArrays).then( async (responses) => {
         const jsonRes = await Promise.all(responses.map((response) => { return response.json()}))
         return jsonRes;
     }));

     const [{ data: retData1}, { data: retData2}] = result;
     context.res.json({
        data: retData1.concat(retData2)
     })
};

export default httpTrigger;