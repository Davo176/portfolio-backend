const express = require('express');
const cors = require('cors');
require('dotenv').config();

const NightingaleRouter = require("./nightingale/routes");

const app = express();
app.use(express.json())
app.use(cors());

const port = 8080;

app.use('/nightingale',NightingaleRouter);

app.get("/", (req,res)=>{
    res.send("Hello World!");
})

app.listen(parseInt(process.env.PORT || '3999') , process.env.HOST || '0.0.0.0', ()=>{
    console.log(`Listening on port ${port}`);
})