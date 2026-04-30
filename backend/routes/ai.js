const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { HfInference } = require('@huggingface/inference');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Initialize API Clients
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_key' 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;
const hf = new HfInference(process.env.HF_TOKEN);

let systemPrompt = `You are the KMCT Campus Buddy, an autonomous AI assistant that manages the entire facility system through voice and vision; your primary directive is to greet guests with a warm welcome—'Welcome to KMCT, I am your campus assistant'—and then actively monitor their speech to either execute navigation commands across the React application, perform RAG-based searches on the campus handbook to answer enquiries, or directly interface with the Node.js backend to schedule appointments and facility bookings. 

CRITICAL GUEST RESTRICTION: The user you are interacting with is a GUEST. Guests are strictly PROHIBITED from booking internal academic facilities such as "Seminar Hall", "Labs", "Auditorium", or "Classrooms". 
Guests are ONLY allowed to book the following specific facilities:
- "Principal Appointment"
- "Admission Enquiries"
If a guest asks to book the Seminar Hall or any prohibited facility, politely refuse and inform them that guests are only permitted to schedule Principal Appointments or Admission Enquiries. Do NOT proceed with collecting booking details for prohibited facilities.

CRITICAL BOOKING PROCEDURE: If the guest wants to book a PERMITTED facility (Principal Appointment or Admission Enquiries), you MUST ask them for ALL of the following details ONE BY ONE in a conversational manner before issuing the 'schedule_appointment' tool_call:
1. Facility name (Must be exactly "Principal Appointment" or "Admission Enquiries")
2. Date (e.g., YYYY-MM-DD or spoken date converted to format)
3. Start time (e.g., HH:MM AM/PM)
4. End time (e.g., HH:MM AM/PM)
5. Purpose of the enquiry/booking

Do NOT issue the 'schedule_appointment' tool_call until you have collected ALL these details. If details are missing, your 'tool_call' should be 'none' and your 'message' should ask the guest for the missing information.

Always respond with structured JSON that includes a short spoken message and a specific 'tool_call' or 'navigate_to' action to ensure the guest sees the relevant UI changes in real-time.`;

router.post('/command', auth, async (req, res) => {
    try {
        const { query, history } = req.body;
        
        let responseData;

        if (genAI) {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemPrompt,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            message: { type: SchemaType.STRING },
                            tool_call: { type: SchemaType.STRING },
                            payload: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    path: { type: SchemaType.STRING },
                                    facility: { type: SchemaType.STRING },
                                    date: { type: SchemaType.STRING },
                                    startTime: { type: SchemaType.STRING },
                                    endTime: { type: SchemaType.STRING },
                                    title: { type: SchemaType.STRING }
                                }
                            }
                        },
                        required: ["message", "tool_call", "payload"]
                    }
                }
            });

            let formattedHistory = [];
            if (history && Array.isArray(history)) {
                const pastMessages = history.slice(0, -1);
                formattedHistory = pastMessages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
            }

            const chat = model.startChat({ history: formattedHistory });
            const result = await chat.sendMessage(query);
            responseData = JSON.parse(result.response.text());

        } else {
            // LOCAL CONVERSATIONAL FALLBACK (No API Key Required)
            // Simulates an LLM gathering data conversationally
            const lowerQuery = query.toLowerCase();
            const fullHistory = (history || []).map(h => h.content).join(" ").toLowerCase() + " " + lowerQuery;

            responseData = { message: "", tool_call: "none", payload: {} };

            if (
                fullHistory.includes("book") || 
                fullHistory.includes("appointment") || 
                fullHistory.includes("enquiry") || 
                fullHistory.includes("schedule") ||
                fullHistory.includes("meet") ||
                fullHistory.includes("see") ||
                fullHistory.includes("visit") ||
                fullHistory.includes("talk to") ||
                fullHistory.includes("looking for") ||
                fullHistory.includes("want to") ||
                fullHistory.includes("admission") ||
                fullHistory.includes("principal")
            ) {
                
                // Extract Facility
                let facility = null;
                if (fullHistory.includes("principal")) facility = "Principal Appointment";
                else if (fullHistory.includes("admission")) facility = "Admission Enquiries";
                else if (fullHistory.includes("seminar") || fullHistory.includes("lab") || fullHistory.includes("auditorium")) {
                    responseData.message = "I apologize, but as a guest, you are only permitted to book a Principal Appointment or Admission Enquiries.";
                    return res.json(responseData);
                }

                // Extract Date
                let date = null;
                const dateMatch = fullHistory.match(/(may|june|july|august|september|october|november|december|january|february|march|april)\s+\d{1,2}/);
                if (dateMatch) date = dateMatch[0];
                if (fullHistory.includes("tomorrow")) date = "Tomorrow";
                if (fullHistory.includes("today")) date = "Today";
                const dayMatch = fullHistory.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
                if (dayMatch && !date) date = dayMatch[0];

                // Extract Time
                let startTime = null;
                let endTime = null;
                const timeMatch = fullHistory.match(/(\d{1,2})(?::\d{2})?\s*(am|pm|o'clock)?/g);
                if (timeMatch && timeMatch.length >= 1) startTime = timeMatch[0].includes('am') || timeMatch[0].includes('pm') ? timeMatch[0] : timeMatch[0] + ' am';
                if (timeMatch && timeMatch.length >= 2) endTime = timeMatch[1];
                else if (startTime) endTime = startTime.replace(/\d+/, (m) => parseInt(m) + 1); // Mock 1 hr duration

                // Determine what's missing
                if (!facility) {
                    responseData.message = "I can help you schedule an appointment. Are you looking for a Principal Appointment or Admission Enquiries?";
                } else if (!date) {
                    responseData.message = `Okay, you'd like to book ${facility}. What date would you like to schedule this for?`;
                } else if (!startTime) {
                    responseData.message = `Got it. ${facility} on ${date}. What time would you like to start?`;
                } else {
                    // Ready to book!
                    responseData.tool_call = "schedule_appointment";
                    responseData.payload = {
                        facility: facility,
                        date: date,
                        startTime: startTime,
                        endTime: endTime || "1 hr later",
                        title: "Guest Booking"
                    };
                    responseData.message = `Perfect. I am scheduling your ${facility} on ${date} at ${startTime}.`;
                }
            } else if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
                responseData = {
                    message: "Navigating to your dashboard.",
                    tool_call: "navigate_to",
                    payload: { path: "/" }
                };
            } else if (lowerQuery.includes('handbook') || lowerQuery.includes('rules')) {
                responseData.message = "According to the campus handbook, visitors must carry their ID at all times.";
            } else {
                responseData.message = "Welcome! I can help you navigate the campus or book a facility like a Principal Appointment. What would you like to do?";
            }
        }

        // If the AI decided to book directly via the Node.js backend
        if (responseData.tool_call === 'schedule_appointment') {
            const { facility, date, startTime, endTime, title } = responseData.payload;
            
            // Hard restriction: Guests cannot book internal facilities
            const allowedGuestFacilities = ["Principal Appointment", "Admission Enquiries"];
            const isGuest = req.user ? req.user.role === 'guest' : true;
            
            if (isGuest && !allowedGuestFacilities.includes(facility)) {
                responseData.tool_call = 'none';
                responseData.message = `I apologize, but as a guest, you are only permitted to book a Principal Appointment or Admission Enquiries. The ${facility} is restricted to students and faculty.`;
            } else if (facility && date && startTime && endTime) {
                 const newBooking = new Booking({
                    userId: req.user ? req.user.id : "guest_id",
                    userName: req.user ? req.user.name : "Guest",
                    userRole: "guest",
                    userCollege: req.user ? req.user.college : "KMCT",
                    purpose: title || "AI Assistant Booking",
                    guestName: "Guest User",
                    guestPhone: "0000000000",
                    facility: facility,
                    title: title || "AI Agent Booking",
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    status: "pending",
                    college: "KMCT",
                    createdAt: new Date()
                });
                await newBooking.save();
                responseData.message += " I have successfully scheduled the appointment for you.";
            } else {
                responseData.tool_call = 'none';
                responseData.message = "I am missing some details to complete the booking. Could you please provide the missing information?";
            }
        }

        res.json(responseData);
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to process command" });
    }
});

module.exports = router;
