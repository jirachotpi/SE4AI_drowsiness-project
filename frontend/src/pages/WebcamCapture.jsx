import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

// ==========================================
// 1. ส่วนตั้งค่าระบบ (CONFIGURATION)
// ==========================================
const CONFIG = {
  INTERVAL_MS: 200,          // ความถี่ในการเช็ค (ms)
  THRESH_LONG_BLINK: 0.4,    // สีเหลือง: ตาปิดเกิน 0.4 วิ
  THRESH_MICROSLEEP: 1.0,    // สีส้ม: ตาปิดเกิน 1.0 วิ (วูบ)
  THRESH_DEEP_SLEEP: 2.0,    // สีแดง: ตาปิดเกิน 2.0 วิ (หลับใน)
  THRESH_STARING: 8.0,       // สีแดง: เหม่อลอย/ตาค้างเกิน 8 วิ
  THRESH_FREQ_COUNT: 5,      // สีแดง: วูบครบ 5 ครั้ง
  COOLDOWN_MS: 60000,        // เวลา reset นับจำนวนวูบ (1 นาที)
  RECOVERY_TIME: 3.0,        // เวลาที่ต้องลืมตาต่อเนื่องเพื่อให้หายง่วง (3 วิ)
  WARNING_DURATION: 1000,    // ความยาวเสียงเตือนสีส้ม
  
  // --- เส้นทางไฟล์เสียง ---
  PATH_WARNING_SOUND: "/Orange_alarm.mp3", 
  PATH_DANGER_SOUND: "/Red_alarm.mp3"
};

function WebcamCapture({ user }) {
  // ==========================================
  // 2. ตัวแปรและ State (VARIABLES)
  // ==========================================
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // UI State
  const [statusText, setStatusText] = useState("รอเริ่มระบบ...");
  const [alertColor, setAlertColor] = useState("gray"); 
  const [debugInfo, setDebugInfo] = useState("");

  // Audio Refs
  const warningAudioRef = useRef(null); 
  const dangerAudioRef = useRef(null); 
  const [isMuted, setIsMuted] = useState(false);

  // Logic State
  const logicState = useRef({
    consecutiveClosedFrames: 0,
    consecutiveOpenFrames: 0,
    drowsyEventCount: 0,
    lastDrowsyEventTime: Date.now(),
    lastBlinkTime: Date.now(),
    isPlayingDanger: false,
    isPlayingWarning: false
  });

  // 👇 [NEW] ตัวช่วยจำค่าสำหรับ Log (เพิ่มใหม่)
  const latestEarRef = useRef(0.0);       // จำค่า EAR ล่าสุดเสมอ
  const eventStartTimeRef = useRef(null); // จำเวลาที่เริ่มง่วง (Start Time)
  const isLoggingRef = useRef(false);     // จำสถานะว่า "กำลังเกิดเหตุ" อยู่ไหม

  // ==========================================
  // [NEW] ฟังก์ชันบันทึก LOG (แก้ใหม่ให้รับ Duration)
  // ==========================================
  const saveLog = async (eventType, duration, ear) => {
    try {
      const username = user ? user.username : "Guest";
      
      // ส่งข้อมูลไปที่ Backend
      await axios.post("http://127.0.0.1:8000/api/logs", {
        user_id: username,
        event_type: eventType,
        ear_value: ear,        // ✅ ส่งค่าจริง
        duration_ms: duration  // ✅ ส่งระยะเวลาจริง
      });
      console.log(`📝 บันทึก: ${eventType} (${duration}ms) EAR:${ear}`);
    } catch (err) {
      console.error("❌ บันทึก Log ไม่สำเร็จ:", err);
    }
  };

  // ==========================================
  // 3. ฟังก์ชันรีเซ็ตระบบ
  // ==========================================
  const resetSystem = () => {
    // แก้ไข: เช็ค null ก่อนเรียกใช้
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
      isPlayingWarning: false
    };
    
    // Reset Log refs
    eventStartTimeRef.current = null;
    isLoggingRef.current = false;
    latestEarRef.current = 0.0;

    setStatusText("ระบบพร้อมทำงาน...");
    setAlertColor("green");
    setDebugInfo("ค่าทั้งหมดถูกรีเซตแล้ว");
  };

  // ==========================================
  // 4. ฟังก์ชันจัดการเสียง
  // ==========================================
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
            }, CONFIG.WARNING_DURATION);
        }
    }
  };
  
  // ==========================================
  // 5. ฟังก์ชันหลัก: จับภาพและวิเคราะห์
  // ==========================================
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
      // ✅ แก้ไข: ป้องกัน Error parameter 2 is not of type 'Blob'
      if (!blob) {
        console.warn("⚠️ ไม่สามารถสร้าง Blob ได้ในเฟรมนี้");
        return; 
      }

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

  // ==========================================
  // 6. สมองของระบบ: วิเคราะห์ความง่วง
  // ==========================================
  const analyzeFatigue = (data) => {
    if (data.ear) {
        latestEarRef.current = data.ear;
    }

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

    if (NOW - state.lastDrowsyEventTime > CONFIG.COOLDOWN_MS) {
        state.drowsyEventCount = 0;
    }

    if (data.is_eye_closed) {
        state.consecutiveClosedFrames += 1;
        state.consecutiveOpenFrames = 0;
        state.lastBlinkTime = NOW; 
    } else {
        state.consecutiveOpenFrames += 1;
        
        const openDuration = state.consecutiveOpenFrames * (CONFIG.INTERVAL_MS / 1000);
        if (openDuration >= CONFIG.RECOVERY_TIME) {
            state.drowsyEventCount = 0; 
        }

        const closedDuration = state.consecutiveClosedFrames * (CONFIG.INTERVAL_MS / 1000);
        if (closedDuration >= CONFIG.THRESH_MICROSLEEP) {
             state.drowsyEventCount += 1; 
             state.lastDrowsyEventTime = NOW;
        }
        state.consecutiveClosedFrames = 0;
    }

    const currentClosedSeconds = (state.consecutiveClosedFrames * (CONFIG.INTERVAL_MS / 1000));
    const stareSeconds = ((NOW - state.lastBlinkTime) / 1000);

    // 🔴 โซนสีแดง
    if (currentClosedSeconds >= CONFIG.THRESH_DEEP_SLEEP || 
        stareSeconds >= CONFIG.THRESH_STARING || 
        state.drowsyEventCount >= CONFIG.THRESH_FREQ_COUNT) {
        
        setAlertColor("red");
        setStatusText("🚨 อันตราย! พักเดี๋ยวนี้");
        handleSound("danger"); 
    } 
    // 🟠 โซนสีส้ม
    else if (currentClosedSeconds >= CONFIG.THRESH_MICROSLEEP) {
        setAlertColor("orange");
        setStatusText(`⚠️ ระวัง! เริ่มวูบ (${currentClosedSeconds.toFixed(1)}s)`);
        handleSound("warning"); 
    }
    // 🟡 โซนสีเหลือง
    else if (currentClosedSeconds >= CONFIG.THRESH_LONG_BLINK) {
        setAlertColor("yellow");
        setStatusText(`ง่วงนอน... (${currentClosedSeconds.toFixed(1)}s)`);
        handleSound("stop"); 
    }
    // 🟢 โซนสีเขียว
    else {
        setAlertColor("green");
        setStatusText("ปกติ (ขับขี่ปลอดภัย)");
        handleSound("stop"); 
    }

    setDebugInfo(`EAR: ${data.ear} | Stare: ${stareSeconds.toFixed(1)}s | Drowsy: ${state.drowsyEventCount}`);
  };

  // ==========================================
  // 7. ฟังก์ชันวาดกราฟิก
  // ==========================================
  const drawOverlay = (box, ear) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;

    if (box) {
        let color = "#00FF00"; 
        if (alertColor === "red") color = "#FF0000";
        else if (alertColor === "orange") color = "#FFA500";
        else if (alertColor === "yellow") color = "#FFFF00";

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(box[0], box[1], box[2], box[3]);
        
        ctx.fillStyle = color;
        ctx.fillRect(box[0], box[1] - 30, 100, 30);
        
        ctx.fillStyle = "black";
        ctx.font = "bold 16px Arial";
        ctx.fillText(`EAR: ${ear}`, box[0] + 5, box[1] - 10);
    }
  };

  // ==========================================
  // 8. เริ่ม/หยุด Loop
  // ==========================================
  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(captureAndDetect, CONFIG.INTERVAL_MS);
    }
    return () => clearInterval(interval);
  }, [isStreaming, alertColor, isMuted]); 

  // 👇 [NEW] Effect สำหรับบันทึก Log
  useEffect(() => {
    if (alertColor === "red" || alertColor === "orange") {
      if (!eventStartTimeRef.current) {
        eventStartTimeRef.current = Date.now(); 
        isLoggingRef.current = true;            
      }
    } 
    else if (alertColor === "green") {
      if (isLoggingRef.current && eventStartTimeRef.current) {
        const endTime = Date.now();
        const duration = endTime - eventStartTimeRef.current; 
        const finalType = duration > 2000 ? "deep_sleep" : "drowsy";
        saveLog(finalType, duration, latestEarRef.current);
        eventStartTimeRef.current = null;
        isLoggingRef.current = false;
      }
    }
  }, [alertColor]);

  // ==========================================
  // 9. ส่วนแสดงผล (RENDER)
  // ==========================================
  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "sans-serif" }}>
      
      <audio ref={warningAudioRef} src={CONFIG.PATH_WARNING_SOUND} preload="auto" />
      <audio ref={dangerAudioRef} src={CONFIG.PATH_DANGER_SOUND} preload="auto" loop />

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); background-color: darkred; }
            100% { opacity: 1; transform: scale(1); }
          }
          .alert-box-red { animation: blink 0.5s infinite; }
        `}
      </style>

      <h2>ระบบตรวจจับความง่วงผู้ขับขี่ (Driver Drowsiness Detection)</h2>
      
      <div 
        className={alertColor === "red" ? "alert-box-red" : ""}
        style={{ 
          padding: "20px", 
          backgroundColor: alertColor === "gray" ? "#ddd" : alertColor,
          color: alertColor === "yellow" || alertColor === "gray" ? "black" : "white", 
          borderRadius: "15px", 
          marginBottom: "20px",
          border: alertColor === "red" ? "5px solid #ff0000" : "none"
      }}>
          <h1 style={{ margin: 0, fontSize: "2.5rem" }}>{statusText}</h1>
          <p style={{ margin: "10px 0 0 0", opacity: 0.8 }}>{debugInfo}</p>
      </div>

      <div style={{ position: "relative", width: "640px", height: "480px", margin: "0 auto", border: "5px solid #333", borderRadius: "10px", overflow: "hidden" }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} />
      </div>

      <div style={{ marginTop: "30px" }}>
        {!isStreaming ? 
            <button onClick={() => { 
                    resetSystem(); 
                    setIsStreaming(true); 
                    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
                        .then(stream => { if(videoRef.current) videoRef.current.srcObject = stream; }); 
                }} 
                style={{padding: "15px 40px", fontSize: "18px", cursor: "pointer", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "50px", marginRight: "10px"}}>
                เริ่มทำงานใหม่ (Start)
            </button> 
            :
            <button onClick={() => setIsStreaming(false)} 
                style={{padding: "15px 40px", fontSize: "18px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "50px", marginRight: "10px"}}>
                หยุด (Stop)
            </button>
        }

        <button onClick={() => setIsMuted(!isMuted)} 
            style={{padding: "15px 40px", fontSize: "18px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "50px"}}>
            {isMuted ? "🔇 ปิดเสียง" : "🔊 เปิดเสียง"}
        </button>
      </div>
    </div>
  );
}

export default WebcamCapture;