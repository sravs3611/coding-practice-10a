const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')

let db = null

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Database Connected')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
initializeDBServer()

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['Authorization']
  if (authHeader !== undefined) {
    jwtToken = autherHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECERT_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

// API 1
app.post('/login', async (request, response) => {
  const {username, password} = request.params
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const user = db.get(getUserQuery)
  if (user === undefined) {
    response.status(400)
    response.send('Invaild user')
  } else {
    const pass = await bcrypt.compare(password, user.password)
    if (pass === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECERET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invaild password')
    }
  }
})

// API 2
app.get('/states', authenticateToken, async (request, response) => {
  const getStatesQuery = `
      SELECT *
      FROM state;`
  const getStates = await db.all(getStatesQuery)
  const convertDBObjectToResponseObject = dbObject => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    }
  }
  response.send(
    getStates.map(eachState => convertDBObjectToResponseObject(eachState)),
  )
})
