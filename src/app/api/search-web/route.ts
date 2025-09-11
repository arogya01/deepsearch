

//create a POST route to search the web for a given query using SERPER API 

export async function POST(req: Request){
    const {query } = await req.json(); // get the query from the request body

    /** 
     * the sample code to call SERPER is as follows: 
     * const axios = require('axios');
let data = JSON.stringify({
  "q": "apple inc"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://google.serper.dev/search',
  headers: { 
    'X-API-KEY': '36689aad8fcc1bab7322cdf19313c4a5642352ab', 
    'Content-Type': 'application/json'
  },
  data : data
};

async function makeRequest() {
  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  }
  catch (error) {
    console.log(error);
  }
}

makeRequest();
     */

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        return Response.json({ error: 'SERPER_API_KEY not configured' }, { status: 500 });
    }
    console.log('calling search-web tool')

    const data = JSON.stringify({
        "q": query
    });

    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: data
    });
    
    const result = await response.json();
    return Response.json(result);
}