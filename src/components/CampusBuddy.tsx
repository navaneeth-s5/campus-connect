import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, User } from 'lucide-react';
import { toast } from 'sonner';

export const CampusBuddy: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [status, setStatus] = useState<string>('Initializing...');
    
    const lastSeenRef = useRef<number>(Date.now());
    const sessionActiveRef = useRef<boolean>(false);
    const isPausedRef = useRef<boolean>(false);
    const recognitionRef = useRef<any>(null);
    const chatHistoryRef = useRef<{ role: string, content: string }[]>([]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && !recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;
        }
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'guest') return;

        const loadModels = async () => {
            try {
                setStatus('Loading AI Models...');
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                setIsModelLoaded(true);
                setStatus('AI Models Loaded. Starting Camera...');
            } catch (err) {
                console.error("Error loading face-api models:", err);
                setStatus('Failed to load AI models.');
            }
        };
        loadModels();
    }, [user]);

    useEffect(() => {
        if (isModelLoaded && user?.role === 'guest') {
            startVideo();
        }
    }, [isModelLoaded, user]);

    const startVideo = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Camera API not available. This might be because you are not on HTTPS or localhost.");
            setStatus('Camera API not available (requires HTTPS/localhost).');
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus('Camera active. Observing...');
            })
            .catch((err) => {
                console.error("Error accessing camera:", err);
                setStatus('Camera access denied.');
            });
    };

    const handleVideoPlay = () => {
        const interval = setInterval(async () => {
            if (videoRef.current) {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );

                if (detections.length > 0) {
                    lastSeenRef.current = Date.now();
                    
                    if (!sessionActiveRef.current) {
                        sessionActiveRef.current = true;
                        isPausedRef.current = false;
                        setHasGreeted(true);
                        handleGuestDetected();
                    } else if (isPausedRef.current) {
                        isPausedRef.current = false;
                        setStatus('Guest returned. Resuming...');
                        speak("Welcome back. Please continue.", () => {
                            startListening();
                        });
                    }
                } else {
                    const timeSince = Date.now() - lastSeenRef.current;
                    if (sessionActiveRef.current) {
                        if (timeSince > 10000) {
                            sessionActiveRef.current = false;
                            isPausedRef.current = false;
                            setHasGreeted(false);
                            setStatus('Session terminated due to absence.');
                            stopListening();
                        } else if (timeSince > 3000 && !isPausedRef.current) {
                            isPausedRef.current = true;
                            setStatus('Waiting for guest to return...');
                            stopListening();
                        }
                    }
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    };

    const speak = (text: string, callback?: () => void) => {
        if (!window.speechSynthesis) {
            console.error("Speech synthesis not supported");
            if (callback) callback();
            return;
        }
        window.speechSynthesis.cancel(); // Stop any previous speech
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            if (callback && sessionActiveRef.current && !isPausedRef.current) {
                callback();
            }
        };
        synth.speak(utterance);
    };

    const handleGuestDetected = () => {
        setStatus('Guest Detected! Greeting...');
        speak("Welcome to KMCT, I am your campus assistant", () => {
            startListening();
        });
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            setIsListening(false);
        }
    };

    const startListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition not supported in this browser.");
            return;
        }

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setStatus('Listening...');
        };

        recognitionRef.current.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setStatus(`Heard: "${transcript}"`);
            setIsListening(false);
            if (sessionActiveRef.current && !isPausedRef.current) {
                await processCommand(transcript);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            if (event.error !== 'aborted') {
                console.error("Speech recognition error", event.error);
                setStatus('Listening stopped (error). Waiting...');
            }
            setIsListening(false);
            if (sessionActiveRef.current && !isPausedRef.current && event.error !== 'aborted') {
                setTimeout(() => { if (!isListening) startListening(); }, 3000);
            }
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        try {
            recognitionRef.current.start();
        } catch (e) {
            // Already started
        }
    };

    const processCommand = async (transcript: string) => {
        setStatus('Processing command...');
        
        chatHistoryRef.current.push({ role: 'user', content: transcript });
        
        try {
            const res = await fetch('/api/ai/command', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ query: transcript, history: chatHistoryRef.current })
            });

            if (!res.ok) throw new Error('API Error');

            const data = await res.json();
            
            chatHistoryRef.current.push({ role: 'model', content: JSON.stringify(data) });
            
            setStatus(`AI Response: ${data.tool_call}`);
            
            // Speak the response
            speak(data.message, () => {
                 // Execute action after speaking
                 if (data.tool_call === 'navigate_to' && data.payload?.path) {
                     navigate(data.payload.path);
                 } else if (data.tool_call === 'schedule_appointment') {
                     // The backend might have already scheduled it, or we might navigate to book
                     toast.success(data.message);
                 }
                 
                 // Resume listening
                 startListening();
            });

        } catch (err) {
            console.error("AI Error:", err);
            speak("I'm sorry, I am having trouble connecting to my brain right now.", () => {
                setTimeout(startListening, 3000);
            });
        }
    };

    if (!user || user.role !== 'guest') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-background border shadow-lg rounded-xl p-4 w-72 transition-all duration-500 ease-in-out hover:scale-105">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-primary font-bold">
                    <Bot className={`w-6 h-6 ${isListening ? 'animate-pulse text-green-500' : ''}`} />
                    <span>Campus Buddy</span>
                </div>
                {isListening && <Mic className="w-4 h-4 text-red-500 animate-pulse" />}
            </div>
            
            <div className="text-xs text-muted-foreground mb-3 font-mono break-words h-10 overflow-hidden">
                {status}
            </div>

            <div className="relative rounded-md overflow-hidden bg-black/10 aspect-video flex items-center justify-center">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    onPlay={handleVideoPlay}
                    className="w-full h-full object-cover opacity-50 mix-blend-luminosity"
                />
                {!isModelLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs animate-pulse">
                        Loading Vision...
                    </div>
                )}
            </div>
            
            {hasGreeted && !isListening && (
                <button 
                    onClick={startListening}
                    className="mt-3 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-md transition-colors"
                >
                    Tap to Speak
                </button>
            )}
        </div>
    );
};
