import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, User, X } from 'lucide-react';
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

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!user || user.role !== 'guest') return null;

    return (
        <div 
            className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${isDragging ? 'scale-[1.02] cursor-grabbing' : ''}`}
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                userSelect: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={handleMouseDown}
        >
            {isCollapsed ? (
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-in zoom-in"
                >
                    <Bot className={`w-7 h-7 ${isListening ? 'animate-pulse' : ''}`} />
                    {isListening && <div className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-background animate-ping" />}
                </button>
            ) : (
                <div className="bg-background border shadow-2xl rounded-2xl p-4 w-72 overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="drag-handle flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-2 text-primary font-black text-sm uppercase tracking-wider">
                            <Bot className={`w-5 h-5 ${isListening ? 'animate-pulse text-green-500' : ''}`} />
                            <span>Campus Buddy</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {isListening && <Mic className="w-3 h-3 text-red-500 animate-pulse mr-2" />}
                            <button 
                                onClick={() => setIsCollapsed(true)}
                                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-[10px] text-muted-foreground mb-3 font-mono break-words h-8 overflow-hidden line-clamp-2 leading-tight">
                        {status}
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-black/10 aspect-video flex items-center justify-center border group">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            onPlay={handleVideoPlay}
                            className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:opacity-80 transition-opacity"
                        />
                        {!isModelLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] animate-pulse font-bold uppercase tracking-widest bg-background/50">
                                Starting Vision Engine...
                            </div>
                        )}
                        <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-xl pointer-events-none" />
                    </div>
                    
                    {hasGreeted && !isListening && (
                        <button 
                            onClick={startListening}
                            className="mt-3 w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Tap to Speak
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
