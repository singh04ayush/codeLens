import express from "express";
import cors from "cors";
import 'dotenv/config'

const PORT = process.env.PORT

const app = express();

app.use(express.json())
app.use(cors({ origin: '*' }))

app.get('/', (req, res) => {
    res.send('CodeLens Server Working')
})

app.listen(PORT, () => {
    console.log(`CodeLens Server is running on port ${PORT}`)
})