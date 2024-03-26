var datasets = ['boardgames'];
const collectionAlias = 'dwp_ownership';
const userId = domo.env.userId;
var gamesOwned = [];
var gameNightPlan = "";
var generatePlanButtonContainer = document.getElementById("generate-plan-button-container");
var generatePlanButtonContainer = document.getElementById("generate-plan-button-container");
var gameNightPlanContainer = document.getElementById("game-night-plan-results-container");

async function fetchData() {
    console.log("fetching data");
    // Query your dataset(s): https://developer.domo.com/docs/dev-studio-references/data-api
    const boardGameDataQuery = `/data/v1/${datasets[0]}`;
    const boardGameOwnershipDataQuery = {
        "owner": {
            "$eq": userId
        }
    }

    const boardGameData = await domo.get(boardGameDataQuery);
    const boardGameOwnershipData = await domo.post(`/domo/datastores/v1/collections/${collectionAlias}/documents/query`, boardGameOwnershipDataQuery)

    const data = mergeGameData(boardGameData, boardGameOwnershipData);

    gamesOwned = data.filter(game => game.owned === true);

    gamesOwned = gamesOwned.map(game => ({
        primary: game.primary,
        description: game.description,
        boardgamecategory: game.boardgamecategory,
        minplaytime: game.minplaytime,
        playingtime: game.playingtime
    }));

    createGenerateActionPlanButton();
    handleResult(data);

}

function mergeGameData(inputData, mergeList) {
    // Step 1: Add an 'owner' field to every item in inputData, defaulting to false
    inputData.forEach(item => {
        item.owned = false;
    });

    // Step 2: Create a mapping from boardGameId to 'owned' status from the mergeList
    const ownershipMap = mergeList.reduce((acc, cur) => {
        const boardGameId = cur.content.boardGameId;
        const ownedStatus = cur.content.owned;
        acc[boardGameId] = ownedStatus;
        return acc;
    }, {});

    // Step 3: Update the 'owner' field in inputData based on the mergeList 'owned' status
    inputData.forEach(item => {
        if (ownershipMap.hasOwnProperty(item.id)) {
            item.owned = ownershipMap[item.id];
        }
    });

    return inputData;
}


const handleCellEdited = async (cell) => {
    
    const rowData = cell._cell.row.data;
    const boardGameId = rowData.id;
    const ownedValue = rowData.owned;
    console.log(rowData);

    // check if a document already exists in AppDB for the current user and board game.
    const appDBQuery = `{
        "owner": {
            "$eq": ${userId}
        },
        "content.boardGameId": {
            "$eq": ${boardGameId}
        }
    }`


    const existingAppDBDocument = await domo.post(`/domo/datastores/v1/collections/${collectionAlias}/documents/query`, appDBQuery)

    console.log(ownedValue);
    const document = {
        "content": {
            "boardGameId": boardGameId,
            "owned": ownedValue
        }
    }
    
    if (existingAppDBDocument.length > 0) {
        // update existing document
        const existingDocumentId = existingAppDBDocument[0].id;
        const updatedDocument = await domo.put(`/domo/datastores/v1/collections/${collectionAlias}/documents/${existingDocumentId}`, document)
        console.log("updatedDocument", updatedDocument);
        

    } else {
        // create new document
        const newDocument = await domo.post(`/domo/datastores/v1/collections/${collectionAlias}/documents/`, document);
        console.log("newDocument", newDocument);
    }

    fetchData(); // Added 
}



function handleResult(data){
  console && console.log(data);

  var table = new Tabulator("#tabulator-table", {
      data:data,
      columns:[
          {title:"Ranking", field:"Board Game Rank"},
          {title:"Image", field:"thumbnail", formatter: "image"},
          {title:"Name", field:"primary", headerFilter:"input"},
          {title:"Description", field:"description", headerFilter:"input"},
          {title:"Stars", field:"average", formatter: "star"},
          {title:"Own", field:"owned", hozAlign:"center", editor: true, cellEdited: handleCellEdited, formatter:"tickCross", headerFilter:"tickCross"},

      ],
      layout:"fitColumns",
      pagination:"local",
      paginationSize:10,
      paginationSizeSelector:[10, 25, 50, 100],
  });
}

const generatePlan = async (gamesOwned) => {
    const prompt = `Please write me an agenda for a fun and engaging game night that lasts between 3 and 4 hours and includes some of the following games: ${JSON.stringify(gamesOwned)}. Please use plenty of puns.`;

    const body = {
        "input": prompt
    }

    const plan = await domo.post(`/domo/ai/v1/text/generation`, body)
    return plan;
}

const createGenerateActionPlanButton = () => {
    const planButton = document.createElement("button");
    planButton.id = "generate-plan-button";
    planButton.textContent = "Generate Game Night Plan";
    generatePlanButtonContainer.innerHTML = "";
    // Insert the button into the container
    generatePlanButtonContainer.appendChild(planButton);

    planButton.addEventListener("click", async function() {
        console.log("clicked button");
        try {
            gameNightPlan = await generatePlan(gamesOwned);
            gameNightPlan = gameNightPlan.choices[0]["output"];

            gameNightPlanContainer.innerHTML = gameNightPlan;

        } catch {
            console.log("Error generating plan");
        }
        
        console.log("games night plan after click", gameNightPlan);
    });

}