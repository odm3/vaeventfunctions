import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { _CONSTANTS_ } from "../Constants";
import fetch from "node-fetch";
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const { authorization } = req.headers;
    const REURL = _CONSTANTS_.ROBOTEVENTSURL || "";
    const headers = {
        'Authorization': `${authorization}`
     };
     const fetchArrays = _CONSTANTS_.SEASON_IDS.map((id) => {
        return fetch(`${REURL}/${id}/events?per_page=${_CONSTANTS_.PAGE_LIMIT}`, { headers });
     });
     const result = await ( await Promise.all(fetchArrays).then( async (responses) => {
         const jsonRes = await Promise.all(responses.map((response) => { return response.json() as any}))
         return jsonRes;
     }));

     const [{ data: retData1}, { data: retData2}] = result;

     return context.res.json({
             data: result[0].concat(result[1])
         }
     );
};

export default httpTrigger;