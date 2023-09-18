import express from "express";
import cors from 'cors';

import NightingaleRouter from "./nightingale/routes";

const app = express();
const port = 8080;

app.use('/nightingale',NightingaleRouter);

app.get("/", (req,res)=>{
    res.send("Hello World!");
})

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})