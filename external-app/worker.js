const express = require('express')
const app = express()
const port = 3000
const request = require('request-promise')
const CAMUNDA_REST_ENDPOINT = "http://localhost:8080/engine-rest/"

app.get('/', (req, res) => res.send('OK'))

app.get("/kick-off-id-process", async (req, res) => {
    const params = {
        json: {
            variables: { 
                personIds: {
                    value: JSON.stringify([1,2,3,200]),
                    type: "json"
                }
            }
        },
        url: `${CAMUNDA_REST_ENDPOINT}process-definition/key/compliance_identity_check/start`
    }

    try{
        response = await request.post(params)
        res.send(200)
    } catch(e) {
        console.log(e)
        res.send(500)
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))