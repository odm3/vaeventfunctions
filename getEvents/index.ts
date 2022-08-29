import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { _CONSTANTS_ } from "../Constants";
import axios from "axios";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
   context.log('HTTP trigger function processed a request.');
   const credential = new DefaultAzureCredential();
   const url = _CONSTANTS_.KEYVAULT_URL || "";
   const client = new SecretClient(url, credential);
   const secret = await client.getSecret(_CONSTANTS_.SECRET_NAME);
   const whitelisted_skus: string[] = JSON.parse(process.env["WHITELISTED_EVENT_SKUS"]);
   const REURL = _CONSTANTS_.ROBOTEVENTSURL || "";
   const championships_visible = (req.query.champsEnabled || process.env["CHAMPS_ENABLED"]) ?? false;
   const headers = {
      'Authorization': `Bearer ${secret.value}`
   };
   const vrcEvents = await getRobotEvents(REURL, _CONSTANTS_.SEASON_IDS[0], 1, headers);
   const viqcEvents = await getRobotEvents(REURL, _CONSTANTS_.SEASON_IDS[1], 1, headers);
   context.res.json({
      data: (vrcEvents.concat(viqcEvents)).filter((event) => {
         return event?.location?.region === "Virginia";
      }).filter((event) => {
         return whitelisted_skus.some((sku) => {
            return sku === event?.sku;
         })
      }).filter((event) => {
         if (!championships_visible) {
            return event?.level !== "Regional"
         }
         return false;
      })

   })
};

const getRobotEvents = async (url: string, id: number, page: number = 1, headers: any) => {
   let returnData = [];
   const query = `${url}/${id}/events?page=${page}`;
   const response = await axios.get(query, { headers });
   const data = response.data;
   returnData.push(data.data);
   const endPage = data.meta?.last_page;
   const promiseQueries = [];
   for (let currPage = page + 1; currPage <= endPage; currPage++) {
      promiseQueries.push(axios.get(`${url}/${id}/events?page=${currPage}`, { headers }));
   }
   await Promise.all(promiseQueries).then((values) => {
      values.forEach((value) => {
         returnData = returnData.concat(value.data.data);
      });
   }).catch((error) => {
      console.log(`Error: ${error}`);
      throw error;
   });
   return returnData;
}
export default httpTrigger;