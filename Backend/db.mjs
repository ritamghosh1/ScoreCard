import mongoose from "mongoose";
import 'dotenv/config';

const mongoUrl = process.env.MONGODB_URL;
async function connect() {
    try {
        await mongoose.connect(mongoUrl);
        console.log("Successfully Connected to DataBase");
    } catch (e) {
        console.log(`We got Error : ${e}`);
    }
}

connect();

const matchSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  format: { type: String, enum: ['T20', 'ODI', 'Test'], required: true },
  player1: {
    name: { type: String, default: 'Ritam' },
    // Notice these are camelCase (strikeRate, totalRuns)
    innings: [{ runs: Number, balls: Number, strikeRate: Number }],
    totalRuns: Number 
  },
  player2: {
    name: { type: String, default: "Riddhiman" },
    innings: [{ runs: Number, balls: Number, strikeRate: Number }],
    totalRuns: Number
  },
  winner: { type: String }
});


export const matchModel = mongoose.model("match", matchSchema);