import express from 'express';
import {db} from './firebase.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotnenv from 'dotenv';
dotnenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from current directory
app.use(express.static(__dirname));

// Landing page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public", "ohm.html"));
});

// Game page
app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname,"public", "index.html"));
});
// Add this route to your existing backend code
app.get("/leaderboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "leaderboard.html"));
});
// Registration endpoint - redirects to game
app.post("/join", async (req, res) => {
    try {
        const {name, email} = req.body;
        if (!name || !email) {
            return res.status(400).json({success: false, error: "Name and email required"});
        }
        
        const uid = email.split("@")[0];
        await db.collection("participants").doc(uid).set({
            name,
            email,
            score: 0,
            joinedAt: Date.now(),
            completed: false
        });
        
        console.log("Registered:", name, email);
        
        // REDIRECT to game with user data in query params
        res.redirect(`/game?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    }   
    catch(err) {
        console.log(err);
        res.status(500).json({success: false, error: "Registration failed"});
    }
});
app.post("/submit-score", async (req, res) => {
    try {
        const {name, email, score} = req.body;
        console.log("📊 Submitting score:", { name, email, score });
        
        const uid = email.split("@")[0];
        
        // Check if document exists first
        const docRef = db.collection("participants").doc(uid);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            // Create new document if it doesn't exist
            console.log("📝 Creating new document for user:", uid);
            await docRef.set({
                name,
                email,
                score: parseInt(score),
                submittedAt: Date.now(),
                completed: true,
                lastPlayed: Date.now()
            });
        } else {
            // Update existing document
            console.log("🔄 Updating existing document for user:", uid);
            await docRef.update({
                name,
                email,
                score: parseInt(score),
                submittedAt: Date.now(),
                completed: true,
                lastPlayed: Date.now()
            });
        }
        
        console.log("✅ Score submitted successfully for:", email);
        res.json({success: true, message: "Score submitted successfully"});
    }
    catch(err) {
        console.error("❌ Score submission error:", err);
        res.status(500).json({success: false, error: "Score submission failed: " + err.message});
    }
});
// FIXED: Leaderboard API endpoint
app.get("/leaderboard", async (req, res) => {
    try {
        console.log("Fetching leaderboard data...");
        
        // Get ALL documents from the participants collection
        const snapshot = await db.collection("participants").get();
        
        if (snapshot.empty) {
            console.log("No participants found in database");
            return res.json([]);
        }
        
        const participants = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Debug log each document
            console.log("Document data:", data);
            
            // Include participants who have submitted scores
            if (data.score !== undefined && data.score !== null) {
                participants.push({
                    name: data.name || "Unknown",
                    email: data.email || "",
                    score: parseInt(data.score) || 0,
                    submittedAt: data.submittedAt || data.joinedAt || 0
                });
            }
        });
        
        // Sort by score (descending)
        participants.sort((a, b) => b.score - a.score);
        
        console.log(`Returning ${participants.length} participants with scores`);
        console.log("Participants:", participants);
        
        // Set proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        
        res.json(participants);
        
    } catch(err) {
        console.error("Leaderboard fetch error:", err);
        
        // For debugging, return test data
        const testData = [
            {
                name: "Test Player 1",
                email: "test1@example.com",
                score: 150,
                submittedAt: Date.now()
            },
            {
                name: "Test Player 2",
                email: "test2@example.com",
                score: 120,
                submittedAt: Date.now()
            },
            {
                name: "op",
                email: "24ituos105@oddu.ac.in",
                score: 90,
                submittedAt: Date.now()
            }
        ];
        
        res.setHeader('Content-Type', 'application/json');
        res.json(testData);
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
    console.log(`Landing: http://localhost:${PORT}`);
    console.log(`Game: http://localhost:${PORT}/game`);
});