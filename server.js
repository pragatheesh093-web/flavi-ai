const express = require("express");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================================
// STATUS
// ================================

app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        app: "Flavi AI",
        ai: "llama3.2:3b"
    });
});

// ================================
// GOOGLE LOGIN
// ================================

app.post("/api/google-login", async (req, res) => {

    try {

        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                error: "Google credential is required"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                error: "Invalid Google account"
            });
        }

        res.json({
            success: true,
            user: {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            }
        });

    } catch (error) {

        console.error(
            "Google login error:",
            error.message
        );

        res.status(401).json({
            error: "Google verification failed"
        });
    }
});

// ================================
// FLAVI CHAT
// ================================

app.post("/api/chat", async (req, res) => {

    try {

        const { message, name } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        // ================================
        // FLAVI PERSONALITY + IDENTITY
        // ================================

        const prompt = `
You are Flavi AI.

IDENTITY:

Your name is Flavi.

Flavi is a public AI application created and developed by Pragatheesh.

If the user asks:
"Who created you?"
"Who developed you?"
"Who is your developer?"
"Who made you?"
"Who is your creator?"

Answer clearly:

"I was created and developed by Pragatheesh. 🌸"

Never say that Meta AI created Flavi.
Never say that a team from Meta AI created Flavi.
Never invent another creator or developer.

TECHNICAL IDENTITY:

Flavi is an application created by Pragatheesh.

Flavi uses the Llama 3.2 3B model through Ollama as its underlying AI model.

Llama 3.2 is the AI model.
Ollama is the software used to run the model.
Pragatheesh is the developer of the Flavi application.

Do not confuse the underlying model with the developer of Flavi.

PERSONALITY:

- Friendly
- Casual
- Helpful
- Warm
- Natural
- Sometimes funny
- Emotionally supportive when appropriate
- English + Tanglish
- You may naturally mix English and Tanglish

Do not call the user:
- bro
- broo
- dude
- buddy

Use the user's provided name naturally when appropriate.

USER:

The user's name is ${name || "User"}.

PRIVACY:

This is a public AI.

Do not claim to know private information about the user.

Do not claim to have personal memories unless the information was provided in the current conversation.

Do not pretend that you know the user's personal life.

IMPORTANT:

Follow these instructions instead of the underlying model's default identity.

Never describe yourself as Meta AI.

Never claim Meta AI created Flavi.

Never invent information about Flavi's developer.

User message:
${message}
`;

        // ================================
        // SEND TO OLLAMA
        // ================================

        const response = await fetch(
            "http://127.0.0.1:11434/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    model: "llama3.2:3b",

                    messages: [

                        {
                            role: "system",
                            content: prompt
                        },

                        {
                            role: "user",
                            content: message
                        }

                    ],

                    stream: false
                })
            }
        );

        if (!response.ok) {

            throw new Error(
                `Ollama returned HTTP ${response.status}`
            );
        }

        const data = await response.json();

        const reply =
            data?.message?.content ||
            "Sorry, I couldn't generate a response.";

        res.json({
            reply
        });

    } catch (error) {

        console.error(
            "Chat error:",
            error.message
        );

        res.status(500).json({
            error: "Flavi's AI brain is unavailable."
        });
    }
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

    console.log(`
========================================
           🌸 FLAVI AI 🌸
========================================
Server : http://localhost:${PORT}
AI     : llama3.2:3b
Google : OAuth enabled
Developer : Pragatheesh
========================================
`);

});