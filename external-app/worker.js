const express = require('express')
const app = express()
const port = 3000
const request = require('request-promise')

const CAMUNDA_REST_ENDPOINT = "http://localhost:8080/engine-rest/"

/*****************************
 * Here is the external task worker.
 * It hangs out and polls Camunda.
*****************************/

const { Client, logger, Variables } = require("camunda-external-task-client-js");

// configuration for the Client:
//  - 'baseUrl': url to the Workflow Engine
//  - 'logger': utility to automatically log important events
const config = { baseUrl: CAMUNDA_REST_ENDPOINT };

// create a Client instance with custom configuration
const client = new Client(config);

client.subscribe("identityCheck_findPersonsToBeIdentified", async function({ task, taskService }) {

  console.log("Finding people who need their identity verified")

  const processVariables = new Variables();

  //Pretend we found these folks in a DB
  const nickSwarr = {
      firstName: "Nick",
      lastName: "Swarr",
      country: "USA",
      dob: "9/15/1982",
      personId: 1
  }

  const abrahamLincoln = {
        firstName: "Abraham",
        lastName: "Lincoln",
        country: "33 United States",
        dob: "2/12/1809",
        personId: 2
  }

  processVariables.set("personsToVerify", [nickSwarr, abrahamLincoln]) 

  // complete the task
  await taskService.complete(task, processVariables);
});

client.subscribe("identityCheck_callIdentityService", async function({ task, taskService }) {
    const personsToVerify = task.variables.get("personsToVerify");

    // This is where we call some external system to get results
    console.log("Going to identify", personsToVerify);
  
    const identityScores = [
        [1, 0.99],
        [2, 0.75]
    ]

    const processVariables = new Variables();
    processVariables.set("identityScores", identityScores)
  
    // complete the task
    await taskService.complete(task, processVariables);
});

client.subscribe("identityCheck_recordIdentificationResults", async function({ task, taskService }) {
    const identityScores = task.variables.get("identityScores");

    // We'll record this info
    console.log("Record scores", identityScores);
  
    // complete the task
    await taskService.complete(task);
});


/*****************************
 * Here is the external web app.
 * It'll tell camunda when it has a process to kick off.
*****************************/

app.get('/', (req, res) => res.send('OK'))

app.get("/kick-off-id-process", async (req, res) => {
    const params = {
        json: {
            variables: { 
                personIds: {
                    value: JSON.stringify([1,2,3]), // faux DB IDs
                    type: "json"
                }
            }
        },
        url: `${CAMUNDA_REST_ENDPOINT}process-definition/key/compliance_identity_check/start`
    }

    try{
        response = await request.post(params)
        console.log(response)
        res.send(200)
    } catch(e) {
        console.log(e)
        res.send(500)
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))