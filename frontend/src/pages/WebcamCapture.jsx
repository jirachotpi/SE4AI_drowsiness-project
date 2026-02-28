// --- frontend/src/pages/WebcamCapture.jsx ---
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

function WebcamCapture({ user }) {
  // ==========================================
  // 1. ตัวแปรและ State (VARIABLES)
  // ==========================================
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [sysConfig, setSysConfig] = useState({
    INTERVAL_MS: 200,
    THRESH_LONG_BLINK: 0.4,
    THRESH_MICROSLEEP: 1.0,
    THRESH_DEEP_SLEEP: 2.0,
    THRESH_STARING: 8.0,
    THRESH_FREQ_COUNT: 5,
    COOLDOWN_MS: 60000,
    RECOVERY_TIME: 3.0,
    WARNING_DURATION: 1000,
    PATH_WARNING_SOUND: "/Orange_alarm.mp3", 
    PATH_DANGER_SOUND: "/Red_alarm.mp3"
  });
  
  const [statusText, setStatusText] = useState("รอระบบเริ่มทำงาน...");
  const [alertColor, setAlertColor] = useState("gray"); 
  const [debugInfo, setDebugInfo] = useState("");

  // ระบบจับเวลา (Timer) 
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // 💡 [NEW] State สำหรับนับจำนวน "เริ่มวูบ" สะสม แทนการกะพริบตา
  const [sessionDrowsyCount, setSessionDrowsyCount] = useState(0);

  const warningAudioRef = useRef(null);
  const dangerAudioRef = useRef(null); 
  const [isMuted, setIsMuted] = useState(false);

  const logicState = useRef({
    consecutiveClosedFrames: 0,
    consecutiveOpenFrames: 0,
    drowsyEventCount: 0,
    lastDrowsyEventTime: Date.now(),
    lastBlinkTime: Date.now(),
    isPlayingDanger: false,
    isPlayingWarning: false,
    hasCountedDrowsyThisTime: false // ป้องกันการนับเบิ้ลใน 1 ครั้งที่วูบ
  });
  
  const latestEarRef = useRef(0.0);       
  const eventStartTimeRef = useRef(null); 
  const isLoggingRef = useRef(false);     
  const eventEarRef = useRef(0.0);

  // ==========================================
  // 2. ฟังก์ชันหลักของระบบตรวจจับ
  // ==========================================
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/admin/config");
        setSysConfig(prev => ({
          ...prev,
          THRESH_MICROSLEEP: res.data.drowsy_time,
          THRESH_DEEP_SLEEP: res.data.sleep_time,
          THRESH_STARING: res.data.staring_time || 8.0
        }));
      } catch (err) {
        console.error("ไม่สามารถดึงการตั้งค่าได้ ใช้ค่าเริ่มต้นแทน", err);
      }
    };
    fetchConfig();
  }, []);

  // Effect สำหรับจับเวลาแบบ Real-time
  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // ฟังก์ชันแปลงวินาทีเป็น HH:MM:SS
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const saveLog = async (eventType, duration, ear) => {
    try {
      const username = user ? user.username : "Guest";
      await axios.post("http://127.0.0.1:8000/api/logs", {
        user_id: username,
        event_type: eventType,
        ear_value: ear,        
        duration_ms: duration  
      });
    } catch (err) {
      console.error("บันทึก Log ไม่สำเร็จ:", err);
    }
  };

  const resetSystem = () => {
    if (warningAudioRef.current) {
        warningAudioRef.current.pause();
        warningAudioRef.current.currentTime = 0;
    }
    if (dangerAudioRef.current) {
        dangerAudioRef.current.pause();
        dangerAudioRef.current.currentTime = 0;
    }

    logicState.current = {
      consecutiveClosedFrames: 0,
      consecutiveOpenFrames: 0,
      drowsyEventCount: 0,
      lastDrowsyEventTime: Date.now(),
      lastBlinkTime: Date.now(),
      isPlayingDanger: false,
      isPlayingWarning: false,
      hasCountedDrowsyThisTime: false
    };
    eventStartTimeRef.current = null;
    isLoggingRef.current = false;
    latestEarRef.current = 0.0;

    // รีเซ็ตตัวเลขเมื่อกดทำงานใหม่
    setElapsedSeconds(0);
    setSessionDrowsyCount(0); // รีเซ็ตการนับวูบ

    setStatusText("ระบบพร้อมทำงาน...");
    setAlertColor("green");
    setDebugInfo("ค่าทั้งหมดถูกรีเซตแล้ว");
  };

  const handleSound = (type) => {
    if (isMuted) return;
    if (type === "stop") {
        if (dangerAudioRef.current) {
            dangerAudioRef.current.pause();
            dangerAudioRef.current.currentTime = 0;
        }
        if (warningAudioRef.current) {
            warningAudioRef.current.pause();
            warningAudioRef.current.currentTime = 0;
        }
        logicState.current.isPlayingDanger = false;
        logicState.current.isPlayingWarning = false;
        return;
    }

    if (type === "danger") {
        if (warningAudioRef.current) {
            warningAudioRef.current.pause();
            warningAudioRef.current.currentTime = 0;
            logicState.current.isPlayingWarning = false;
        }

        if (!logicState.current.isPlayingDanger && dangerAudioRef.current) {
            logicState.current.isPlayingDanger = true;
            dangerAudioRef.current.currentTime = 0;
            dangerAudioRef.current.play().catch((e) => console.log("Audio play error:", e));
        }
    }

    if (type === "warning") {
        if (!logicState.current.isPlayingWarning && !logicState.current.isPlayingDanger && warningAudioRef.current) {
            logicState.current.isPlayingWarning = true;
            warningAudioRef.current.currentTime = 0;
            warningAudioRef.current.play().catch((e) => console.log("Audio play error:", e));

            setTimeout(() => {
                if (!logicState.current.isPlayingDanger && warningAudioRef.current) {
                    warningAudioRef.current.pause();
                    warningAudioRef.current.currentTime = 0;
                }
                logicState.current.isPlayingWarning = false; 
            }, sysConfig.WARNING_DURATION);
        }
    }
  };
  
  const captureAndDetect = async () => {
    if (!videoRef.current || !isStreaming) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    tempCanvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const res = await axios.post("http://127.0.0.1:8000/api/detect", formData);
        const data = res.data;
        drawOverlay(data.face_box, data.ear);
        analyzeFatigue(data);
      } catch (err) {
        console.error("API Error:", err.response?.data || err.message);
      }
    }, "image/jpeg");
  };

  const analyzeFatigue = (data) => {
    if (data.ear) latestEarRef.current = data.ear;

    const NOW = Date.now();
    const state = logicState.current;

    if (data.status === "no_face") {
        setStatusText("ไม่พบใบหน้า");
        setAlertColor("gray");
        state.consecutiveClosedFrames = 0;
        state.consecutiveOpenFrames = 0;
        handleSound("stop");
        return;
    }

    if (NOW - state.lastDrowsyEventTime > sysConfig.COOLDOWN_MS) {
        state.drowsyEventCount = 0;
    }

    if (data.is_eye_closed) {
        state.consecutiveClosedFrames += 1;
        state.consecutiveOpenFrames = 0;
        state.lastBlinkTime = NOW; 
        
        const closedDuration = state.consecutiveClosedFrames * (sysConfig.INTERVAL_MS / 1000);
        
        // 💡 [NEW] นับอาการวูบ และแจ้งเตือนเมื่อครบ 5 ครั้ง
        if (closedDuration >= sysConfig.THRESH_MICROSLEEP && !state.hasCountedDrowsyThisTime) {
            state.hasCountedDrowsyThisTime = true; // ล็อคไว้ไม่ให้นับซ้ำในเฟรมถัดไปจนกว่าจะลืมตา
            state.drowsyEventCount += 1;
            state.lastDrowsyEventTime = NOW;

            setSessionDrowsyCount(prev => {
                const newCount = prev + 1;
                // ถ้าครบ 5 ครั้ง ให้เด้ง Alert
                if (newCount > 0 && newCount % 5 === 0) {
                    setTimeout(() => {
                        alert(`⚠️ คำเตือนอันตราย: ตรวจพบอาการ 'เริ่มวูบ' สะสมถึง ${newCount} ครั้งแล้ว! กรุณาจอดพักรถทันทีเพื่อความปลอดภัย`);
                    }, 200);
                }
                return newCount;
            });
        }
    } else {
        state.consecutiveOpenFrames += 1;
        const openDuration = state.consecutiveOpenFrames * (sysConfig.INTERVAL_MS / 1000);
        if (openDuration >= sysConfig.RECOVERY_TIME) {
            state.drowsyEventCount = 0;
        }
        state.consecutiveClosedFrames = 0;
        state.hasCountedDrowsyThisTime = false; // ปลดล็อคเมื่อลืมตา
    }

    const currentClosedSeconds = (state.consecutiveClosedFrames * (sysConfig.INTERVAL_MS / 1000));
    const stareSeconds = ((NOW - state.lastBlinkTime) / 1000);
    
    if (currentClosedSeconds >= sysConfig.THRESH_DEEP_SLEEP || 
        stareSeconds >= sysConfig.THRESH_STARING || 
        state.drowsyEventCount >= sysConfig.THRESH_FREQ_COUNT) {
        setAlertColor("red");
        setStatusText("อันตราย! พักเดี๋ยวนี้");
        handleSound("danger"); 
    } else if (currentClosedSeconds >= sysConfig.THRESH_MICROSLEEP) {
        setAlertColor("orange");
        setStatusText(`ระวัง! เริ่มวูบ (${currentClosedSeconds.toFixed(1)}s)`);
        handleSound("warning"); 
    } else if (currentClosedSeconds >= sysConfig.THRESH_LONG_BLINK) {
        setAlertColor("yellow");
        setStatusText(`ง่วงนอน... (${currentClosedSeconds.toFixed(1)}s)`);
        handleSound("stop"); 
    } else {
        setAlertColor("green");
        setStatusText("ปกติ (ขับขี่ปลอดภัย)");
        handleSound("stop");
    }
    setDebugInfo(`EAR: ${data.ear} | Stare: ${stareSeconds.toFixed(1)}s`);
  };

  const drawOverlay = (box, ear) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    
    if (box) {
        let color = "#10b981"; // green
        if (alertColor === "red") color = "#e11d48";
        else if (alertColor === "orange") color = "#f97316";
        else if (alertColor === "yellow") color = "#fbbf24";
        else if (alertColor === "gray") color = "#94a3b8";

        // 💡 [NEW] แก้กรอบกลับหัว (Mirror Fix): คำนวณแกน X ให้สลับซ้าย-ขวา เพื่อให้ตรงกับ Video ที่ตั้งค่า ScaleX(-1) ไว้
        const canvasWidth = canvasRef.current.width;
        const boxWidth = box[2];
        const flippedX = canvasWidth - box[0] - boxWidth;

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(flippedX, box[1], boxWidth, box[3]);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(flippedX, box[1] - 32, 110, 32, [6, 6, 0, 0]);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(`EAR: ${ear}`, flippedX + 8, box[1] - 10);
    }
  };

  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(captureAndDetect, sysConfig.INTERVAL_MS);
    }
    return () => clearInterval(interval);
  }, [isStreaming, alertColor, isMuted, sysConfig]);

  useEffect(() => {
    if (alertColor === "red" || alertColor === "orange") {
      if (!eventStartTimeRef.current) {
        eventStartTimeRef.current = Date.now(); 
        isLoggingRef.current = true;            
        eventEarRef.current = latestEarRef.current; 
      }
    } 
    else if (alertColor === "green") {
      if (isLoggingRef.current && eventStartTimeRef.current) {
        const endTime = Date.now();
        const duration = endTime - eventStartTimeRef.current; 
        const finalType = duration > 2000 ? "deep_sleep" : "drowsy";
        saveLog(finalType, duration, eventEarRef.current);
        eventStartTimeRef.current = null;
        isLoggingRef.current = false;
      }
    }
  }, [alertColor]);

  const toggleCamera = () => {
    if (!isStreaming) {
      resetSystem();
      setIsStreaming(true);
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => { if(videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => {
            console.error("Camera error:", err);
            setIsStreaming(false);
            setStatusText("ไม่สามารถเปิดกล้องได้");
        });
    } else {
      setIsStreaming(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setStatusText("รอระบบเริ่มทำงาน...");
      setAlertColor("gray");
      setDebugInfo("");
      handleSound("stop");
    }
  };

  // ==========================================
  // 3. จัดการสไตล์ UI ตามสถานะ (Theme Light)
  // ==========================================
  const getStatusConfig = () => {
    switch (alertColor) {
      case "red":
        return {
          color: "text-rose-600",
          bg: "bg-rose-50",
          border: "border-rose-500",
          glow: "shadow-[0_0_20px_rgba(225,29,72,0.2)]",
          animation: "animate-[pulse_0.5s_ease-in-out_infinite]",
        };
      case "orange":
      case "yellow":
        return {
          color: "text-amber-500",
          bg: "bg-amber-50",
          border: "border-amber-400",
          glow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]",
          animation: "animate-pulse",
        };
      case "green":
        return {
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          border: "border-emerald-500/50",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          animation: "",
        };
      case "gray":
      default:
        return {
          color: "text-gray-500",
          bg: "bg-gray-100",
          border: "border-gray-200",
          glow: "",
          animation: "",
        };
    }
  };

  const statusCfg = getStatusConfig();

  const getParsedStats = () => {
    const earMatch = debugInfo.match(/EAR:\s*([\d.]+)/);
    const stareMatch = debugInfo.match(/Stare:\s*([\d.]+s)/);
    return {
      ear: earMatch ? earMatch[1] : "0.00",
      stare: stareMatch ? stareMatch[1] : "0.0s"
    };
  };
  const stats = getParsedStats();

  return (
    <div className="w-full flex justify-center font-sans mt-8">
      
      {/* Container หลัก */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 px-4">
        
        {/* Audio Sources */}
        <audio ref={warningAudioRef} src={sysConfig.PATH_WARNING_SOUND} preload="auto" />
        <audio ref={dangerAudioRef} src={sysConfig.PATH_DANGER_SOUND} preload="auto" loop />

        {/* ฝั่งซ้าย: กล้อง AI */}
        <div className="flex-1 flex flex-col gap-4">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={alertColor}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`py-4 px-6 rounded-2xl border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.glow} ${statusCfg.animation} flex items-center justify-center transition-colors duration-300 shadow-sm`}
            >
              <h2 className={`text-2xl font-bold tracking-wide ${statusCfg.color}`}>
                {statusText}
              </h2>
            </motion.div>
          </AnimatePresence>

          <div className={`relative w-full aspect-[4/3] rounded-3xl bg-gray-50 border-2 overflow-hidden transition-all duration-300 shadow-sm flex items-center justify-center ${isStreaming ? statusCfg.border : 'border-gray-200'}`}>
            
            {isStreaming && (
              <div className="absolute bottom-4 left-4 font-mono text-xs text-gray-500 bg-white/90 px-3 py-1.5 rounded-md backdrop-blur-sm z-10 uppercase border border-gray-200 shadow-sm">
                SYS.ON // FPS: OPTIMAL // LIVE
              </div>
            )}

            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${!isStreaming ? 'hidden' : ''}`}
            />
            {/* 💡 [NEW] ปลด CSS -scale-x-100 ออกจาก Canvas เพื่อให้ตัวอักษรไม่กลับด้าน และขยับตาม Logic ที่ตั้งไว้ */}
            <canvas 
              ref={canvasRef} 
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 ${!isStreaming ? 'hidden' : ''}`}
            />

            {!isStreaming && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ฝั่งขวา: Controls & Data */}
        <div className="w-full lg:w-[360px] flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-6">System Controls</h3>
            
            <div className="space-y-3">
              <button 
                onClick={toggleCamera}
                className={`w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-300 ${
                  isStreaming 
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                }`}
              >
                {isStreaming ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                    </svg>
                    หยุดการตรวจจับ
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                    เริ่มทำงานใหม่
                  </>
                )}
              </button>

              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-full py-3.5 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-300 border ${
                  isMuted 
                    ? "bg-gray-50 text-gray-500 border-gray-200" 
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {isMuted ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                    ปิดเสียงเตือน
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                    เปิดเสียงเตือนปกติ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Session Data Panel */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 flex-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
               </svg>
               Session Data
             </h3>
             <div className="space-y-3">
                
                {/* 1. ระยะเวลาขับขี่ */}
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-gray-500 font-medium">ระยะเวลาขับขี่</span>
                    <span className="text-gray-900 font-mono font-bold tracking-wide">
                      {isStreaming ? formatTime(elapsedSeconds) : "00:00:00"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <motion.div 
                      className="bg-blue-500 h-1 rounded-full" 
                      initial={{ width: "0%" }}
                      animate={{ width: isStreaming ? "100%" : "0%" }}
                      transition={{ duration: elapsedSeconds > 0 ? elapsedSeconds : 1, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* 2. 💡 [NEW] จำนวนเริ่มวูบสะสม (เตือนเมื่อครบ 5) */}
                <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 flex justify-between items-center text-sm">
                    <span className="text-amber-600 font-bold flex items-center gap-1.5">
                      ⚠️ จำนวนเริ่มวูบสะสม
                    </span>
                    <span className="text-amber-800 font-mono font-black bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">
                      {isStreaming ? sessionDrowsyCount : "-"} / 5
                    </span>
                </div>

                {/* 3. ค่า EAR ปัจจุบัน */}
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">ค่า EAR ปัจจุบัน</span>
                    <span className={`font-mono font-bold ${parseFloat(stats.ear) < 0.2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {isStreaming ? stats.ear : "-.--"}
                    </span>
                </div>

                {/* 4. ระยะเวลาจ้องมอง */}
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">ระยะเวลาจ้องมอง</span>
                    <span className={`font-mono font-bold ${parseFloat(stats.stare) > sysConfig.THRESH_STARING ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isStreaming ? stats.stare : "-.-s"}
                    </span>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default WebcamCapture;