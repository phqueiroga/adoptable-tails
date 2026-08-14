const timeout=()=>AbortSignal.timeout(18000);
async function responseJson(url,options={}){const response=await fetch(url,{...options,signal:timeout()});if(!response.ok)throw new Error(`EXTERNAL_API_${response.status}_${(await response.text()).slice(0,700)}`);return response.json()}

export async function searchPlaces({query,destination,open_now=false,min_rating=0,page_size=10}){
  if(!process.env.GOOGLE_MAPS_API_KEY)throw new Error("GOOGLE_MAPS_NOT_CONFIGURED");
  const fields=["places.id","places.displayName","places.formattedAddress","places.location","places.primaryType","places.businessStatus","places.currentOpeningHours","places.rating","places.userRatingCount","places.priceLevel","places.accessibilityOptions","places.googleMapsUri"];
  const data=await responseJson("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"content-type":"application/json","X-Goog-Api-Key":process.env.GOOGLE_MAPS_API_KEY,"X-Goog-FieldMask":fields.join(",")},body:JSON.stringify({textQuery:`${query} in ${destination}`,openNow:Boolean(open_now),minRating:Number(min_rating)||undefined,pageSize:Math.min(15,Math.max(1,Number(page_size)||10)),languageCode:"en"})});
  const results=(data.places??[]).map(place=>({entity_id:`place:${place.id}`,label:place.displayName?.text||"Unnamed place",type:place.primaryType||null,address:place.formattedAddress||null,location:place.location||null,business_status:place.businessStatus||null,open_now:place.currentOpeningHours?.openNow??null,current_hours:place.currentOpeningHours?.weekdayDescriptions??[],rating:place.rating??null,user_rating_count:place.userRatingCount??null,price_level:place.priceLevel??null,accessibility:place.accessibilityOptions??null,source_url:place.googleMapsUri||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text||query)}`}));
  return{provider:"Google Places",query:`${query} in ${destination}`,queried_at:new Date().toISOString(),result_count:results.length,results};
}

export const externalToolDefinitions=[
  ...(process.env.GOOGLE_MAPS_API_KEY?[{name:"search_places",description:"Identify the client's visitor attraction in Google Places and retrieve current place metadata such as official name, address, category, coordinates, opening-hour data, ratings and accessibility fields. Search for the named attraction, not unrelated recommendations.",input_schema:{type:"object",properties:{query:{type:"string"},destination:{type:"string"},open_now:{type:"boolean"},min_rating:{type:"number",minimum:0,maximum:5},page_size:{type:"integer",minimum:1,maximum:5}},required:["query","destination","open_now","min_rating","page_size"],additionalProperties:false}}]:[])
];

export async function executeExternalTool(name,input){if(name==="search_places")return searchPlaces(input);throw new Error(`UNKNOWN_TOOL_${name}`)}
