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
const config = { baseUrl: CAMUNDA_REST_ENDPOINT, use: logger };

// create a Client instance with custom configuration
const client = new Client(config);

// susbscribe to the topic: 'external_check_id_task'
client.subscribe("external_check_id_task", async function({ task, taskService }) {

  // This is where we call some external system to get results
  console.log(task);

  const processVariables = new Variables();
  processVariables.set("hasBegunIdentification", true);

  // complete the task
  await taskService.complete(task, processVariables);
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
                    value: JSON.stringify([1,2,3,200, 300]),
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