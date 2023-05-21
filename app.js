import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.post("/getImage", (req, res) => {


    res.status(200).send(req.body);
});

app.listen(process.env.PORT || 8000 , () => {
    console.log("Server is up and running");
});

