import express from "express";
import { matchModel } from "./db.mjs";
import 'dotenv/config';
import cors from 'cors';
const port = process.env.PORT;
const app = express();

// Middleware: Automatically parses incoming JSON payloads from the frontend
// and attaches them to the req.body object.
app.use(express.json());
app.use(cors()); 
/**
 * POST /api/matches
 * Purpose: Receives match data from the frontend, calculates strike rates 
 * and the winner, and saves the final document to the database.
 */
app.post('/api/matches', async (req, res) => {
  try {
    const { format, player1, player2 } = req.body;

    // Helper function to clean the innings data
    const cleanInnings = (inningsArray) => {
      // 1. Filter out empty innings (where user didn't type anything)
      const validInnings = inningsArray.filter(inn => inn.runs !== "" && inn.balls !== "");
      
      // 2. Convert strings to valid Numbers and calculate Strike Rate
      return validInnings.map(inn => {
        const runs = Number(inn.runs) || 0;
        const balls = Number(inn.balls) || 0;
        // Prevent dividing by zero!
        const strikeRate = balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0;
        
        return { runs, balls, strikeRate };
      });
    };

    // Clean data for both players
    const cleanedP1Innings = cleanInnings(player1.innings);
    const cleanedP2Innings = cleanInnings(player2.innings);

    // Calculate Total Runs
    const p1TotalRuns = cleanedP1Innings.reduce((sum, inn) => sum + inn.runs, 0);
    const p2TotalRuns = cleanedP2Innings.reduce((sum, inn) => sum + inn.runs, 0);

    // Determine Winner automatically
    let matchWinner = "Draw";
    if (p1TotalRuns > p2TotalRuns) matchWinner = player1.name;
    if (p2TotalRuns > p1TotalRuns) matchWinner = player2.name;

    // Create the final match object matching your Schema perfectly
    const newMatch = new matchModel({
      format: format,
      player1: { 
        name: player1.name, 
        innings: cleanedP1Innings, 
        totalRuns: p1TotalRuns 
      },
      player2: { 
        name: player2.name, 
        innings: cleanedP2Innings, 
        totalRuns: p2TotalRuns 
      },
      winner: matchWinner
    });

    // Save to MongoDB
    await newMatch.save();
    
    // Send success back to Frontend
    res.status(200).json({ message: "Match saved successfully!", match: newMatch });

  } catch (error) {
    console.error("🔥 POST ROUTE CRASHED:", error); // This will show in Render logs!
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

/**
 * GET /api/stats/:playerName?format=FORMAT
 * Purpose: Aggregates career statistics for a specific player in a specific format.
 */
app.get("/api/stats/:playerName", async (req, res) => {
    try {
        // Extract variables: param comes from the URL path, query comes after the '?'
        const player = req.params.playerName;
        const format = req.query.format;

        // Validation: Ensure the frontend actually requested a specific format
        if (!format) {
            return res.status(400).json({ msg: "Please Provide the Format" });
        }

        // --- DATABASE QUERY ---
        // Find all matches matching the format WHERE the target player is either Player 1 OR Player 2
        const matches = await matchModel.find({
            format: format,
            $or: [
                { "player1.name": player },
                { "player2.name": player }
            ]
        });

        // Initialize counters for career aggregation
        let totalRuns = 0;
        let totalBalls = 0;
        let inningsPlayed = 0;
        let matchesWon = 0;
        let hcents = 0;
        let cents = 0;

        // Loop through every match the player participated in
        matches.forEach(match => {
            // Determine if our target player batted as player1 or player2 in this specific match
            const playerData = match.player1.name == player ? match.player1 : match.player2;

            // Loop through their innings (1 loop for T20/ODI, 2 loops for Test)
            playerData.innings.forEach(inning => {
                totalRuns += inning.runs;

                // Track milestones based on individual inning scores
                if (inning.runs >= 100) {
                    cents += 1;
                } else if (inning.runs >= 50) {
                    hcents += 1;
                }

                totalBalls += inning.balls;
                inningsPlayed += 1;
            });

            // Increment win counter if their name matches the saved winner
            if (match.winner == player) {
                matchesWon += 1;
            }
        });

        // --- FINAL CALCULATIONS ---
        // Use ternary operators (> 0 ?) to prevent division-by-zero errors if the player has 0 matches
        const careerStrikeRate = totalBalls > 0 ? parseFloat(((totalRuns / totalBalls) * 100).toFixed(2)) : 0;
        const average = inningsPlayed > 0 ? parseFloat((totalRuns / inningsPlayed).toFixed(2)) : 0;

        // --- RESPONSE ---
        // Send the compiled stats back to the frontend dashboard
        res.status(200).send({
            player: player,
            format: format,
            stats: {
                matchesPlayed: matches.length,
                inningsPlayed: inningsPlayed,
                totalRuns: totalRuns,
                totalBalls: totalBalls,
                careerStrikeRate: careerStrikeRate,
                average: average,
                matchesWon: matchesWon,
                centuries: cents,
                half_centuries: hcents
            }
        });
    } catch (e) {
        res.status(500).send({
            msg: "Internal Server Error",
            error: e.message
        });
    }
});

app.get("/api/compare", async (req, res) => {
    try {
        const format = req.query.format;

        // Validation: Ensure the frontend actually requested a specific format
        if (!format) {
            return res.status(400).json({ msg: "Please Provide the Format" });
        }

        const matches = await matchModel.find({
            format: format
        });

        let players = {};
        let totalDraws = 0;

        matches.forEach(match => {
            const p1Name = match.player1.name;
            const p2Name = match.player2.name;

            // If the player isn't in our tracking object yet, add them
            if (!players[p1Name]) {
                players[p1Name] = { name: p1Name, totalRuns: 0, totalBalls: 0, inningsPlayed: 0, wins: 0 };
            }
            if (!players[p2Name]) {
                players[p2Name] = { name: p2Name, totalRuns: 0, totalBalls: 0, inningsPlayed: 0, wins: 0 };
            }

            // Aggregate Player 1 data
            match.player1.innings.forEach(inning => {
                players[p1Name].totalRuns += inning.runs;
                players[p1Name].totalBalls += inning.balls;
                players[p1Name].inningsPlayed++;
            });

            // Aggregate Player 2 data
            match.player2.innings.forEach(inning => {
                players[p2Name].totalRuns += inning.runs;
                players[p2Name].totalBalls += inning.balls;
                players[p2Name].inningsPlayed++;
            });

            // Track wins dynamically
            if (match.winner === p1Name) {
                players[p1Name].wins++;
            } else if (match.winner === p2Name) {
                players[p2Name].wins++;
            } else {
                totalDraws++;
            }
        });

        // Convert our dynamic object into an array and calculate the final averages
        const comparisonArray = Object.values(players).map(stats => {
            stats.careerStrikeRate = stats.totalBalls > 0 ? parseFloat(((stats.totalRuns / stats.totalBalls) * 100).toFixed(2)) : 0;
            stats.average = stats.inningsPlayed > 0 ? parseFloat((stats.totalRuns / stats.inningsPlayed).toFixed(2)) : 0;
            return stats;
        });

        // Send the clean array back to React
        res.status(200).json({
            format: format,
            totalMatches: matches.length,
            totalDraws: totalDraws,
            comparison: comparisonArray
        });
        
    } catch (e) {
        res.status(500).send({
            msg: "Internal Server Error",
            error: e.message
        });
    }

})


// Start the Express server
app.listen(port, () => {
    console.log(`App is Running at port ${port}`);
});