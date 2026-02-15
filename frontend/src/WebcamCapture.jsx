import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

// --- CONFIGURATION (ค่าที่ปรับจูนแล้ว) ---
const CONFIG = {
  INTERVAL_MS: 200,          // ตรวจจับทุกๆ 0.2 วินาที (5 FPS)
  THRESH_LONG_BLINK: 0.4,    // ง่วง: ตาปิดเกิน 0.4 วิ
  THRESH_MICROSLEEP: 1.0,    // อันตราย: ตาปิดเกิน 1.0 วิ (วูบ)
  THRESH_DEEP_SLEEP: 2.0,    // วิกฤต: ตาปิดเกิน 2.0 วิ
  THRESH_STARING: 12.0,      // เหม่อลอย: ตาค้างเกิน 12 วิ
  THRESH_FREQ_COUNT: 5,      // วูบบ่อย: เกิน 2 ครั้งใน 1 นาที
  COOLDOWN_MS: 60000         // เวลาในการรีเซ็ตค่าวูบสะสม (1 นาที)
};

function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // UI State
  const [statusText, setStatusText] = useState("รอเริ่มระบบ...");
  const [alertColor, setAlertColor] = useState("gray"); // gray, green, yellow, orange, red
  const [debugInfo, setDebugInfo] = useState("");

  // Logic State (ใช้ useRef เพื่อไม่ให้ Re-render บ่อยเกินไป)
  const logicState = useRef({
    consecutiveClosedFrames: 0, // จำนวนเฟรมที่ตาปิดต่อเนื่อง
    drowsyEventCount: 0,        // จำนวนครั้งที่วูบหลับ
    lastDrowsyEventTime: Date.now(),
    lastBlinkTime: Date.now()   // เวลาล่าสุดที่กระพริบตา (ใช้จับ Staring)
  });

  // ฟังก์ชันหลัก: จับภาพ -> ส่ง AI -> วิเคราะห์
  const captureAndDetect = async () => {
    if (!videoRef.current || !isStreaming) return;

    const video = videoRef.current;
    
    // สร้าง Canvas ชั่วคราวเพื่อดึงภาพ
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext("2d").drawImage(video, 0, 0);

    tempCanvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const res = await axios.post("http://127.0.0.1:8000/api/detect", formData);
        const data = res.data;
        
        // 1. วาดกรอบหน้า UI
        drawOverlay(data.face_box, data.ear);
        
        // 2. วิเคราะห์พฤติกรรม (Core Logic)
        analyzeFatigue(data);

      } catch (err) {
        console.error("API Error:", err);
      }
    }, "image/jpeg");
  };

  // ฟังก์ชันวิเคราะห์ความล้า (Brain)
  const analyzeFatigue = (data) => {
    const NOW = Date.now();
    const state = logicState.current;

    // A. ถ้าไม่เจอหน้า (No Face)
    if (data.status === "no_face") {
        setStatusText("ไม่พบใบหน้า");
        setAlertColor("gray");
        state.consecutiveClosedFrames = 0;
        return;
    }

    // B. Reset ตัวนับความถี่ (Cooldown 1 นาที)
    if (NOW - state.lastDrowsyEventTime > CONFIG.COOLDOWN_MS) {
        state.drowsyEventCount = 0;
    }

    // C. ตรวจจับสถานะตา (Eye Logic)
    if (data.is_eye_closed) {
        // [ตาปิด]
        state.consecutiveClosedFrames += 1;
        
        // รีเซ็ตเวลาตาค้าง (เพราะหลับตาแล้ว แปลว่าไม่ได้จ้อง)
        state.lastBlinkTime = NOW; 
    } else {
        // [ตาเปิด]
        // เช็คว่าก่อนหน้านี้หลับตานานแค่ไหน?
        const closedDuration = state.consecutiveClosedFrames * (CONFIG.INTERVAL_MS / 1000);

        // ถ้ารอบที่แล้วหลับตานานกว่า Threshold (วูบ) ให้นับสถิติ
        if (closedDuration >= CONFIG.THRESH_MICROSLEEP) {
             state.drowsyEventCount += 1;
             state.lastDrowsyEventTime = NOW;
        }
        
        // รีเซ็ตตัวนับตาปิด
        state.consecutiveClosedFrames = 0;
    }

    // D. ประมวลผลเพื่อตัดสินใจ (Decision Making)
    const currentClosedSeconds = (state.consecutiveClosedFrames * (CONFIG.INTERVAL_MS / 1000));
    const stareSeconds = ((NOW - state.lastBlinkTime) / 1000);

    // --- DECISION TREE ---
    if (currentClosedSeconds >= CONFIG.THRESH_DEEP_SLEEP) {
        setAlertColor("red");
        setStatusText(`🚨 อันตราย! หลับใน (${currentClosedSeconds.toFixed(1)}s)`);
        // TODO: Play Sound Here
    } 
    else if (currentClosedSeconds >= CONFIG.THRESH_MICROSLEEP) {
        setAlertColor("orange");
        setStatusText(`⚠️ วูบหลับ! (${currentClosedSeconds.toFixed(1)}s)`);
    }
    else if (currentClosedSeconds >= CONFIG.THRESH_LONG_BLINK) {
        setAlertColor("yellow");
        setStatusText(`ง่วงนอน... (${currentClosedSeconds.toFixed(1)}s)`);
    }
    else if (stareSeconds >= CONFIG.THRESH_STARING) {
        setAlertColor("orange");
        setStatusText(`⚠️ เหม่อลอย / ตาค้าง (${stareSeconds.toFixed(1)}s)`);
    }
    else if (state.drowsyEventCount >= CONFIG.THRESH_FREQ_COUNT) {
        setAlertColor("red");
        setStatusText(`🚨 พักเดี๋ยวนี้! (วูบ ${state.drowsyEventCount} ครั้ง)`);
    }
    else {
        setAlertColor("green");
        setStatusText("ปกติ (ขับขี่ปลอดภัย)");
    }

    // Debug Info
    setDebugInfo(`EAR: ${data.ear} | Stare: ${stareSeconds.toFixed(1)}s | DrowsyCount: ${state.drowsyEventCount}`);
  };

  // ฟังก์ชันวาดกราฟิกทับวิดีโอ
  const drawOverlay = (box, ear) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    
    // Clear Canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Sync Size
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;

    if (box) {
        // กำหนดสีตามสถานะแจ้งเตือน
        let color = "#00FF00"; // Green
        if (alertColor === "red") color = "#FF0000";
        else if (alertColor === "orange") color = "#FFA500";
        else if (alertColor === "yellow") color = "#FFFF00";

        // วาดกรอบ
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(box[0], box[1], box[2], box[3]);
        
        // วาดพื้นหลังข้อความ
        ctx.fillStyle = color;
        ctx.fillRect(box[0], box[1] - 30, 100, 30);
        
        // วาดข้อความ EAR
        ctx.fillStyle = "black";
        ctx.font = "bold 16px Arial";
        ctx.fillText(`EAR: ${ear}`, box[0] + 5, box[1] - 10);
    }
  };

  // Loop ทำงานทุก 200ms
  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(captureAndDetect, CONFIG.INTERVAL_MS);
    }
    return () => clearInterval(interval);
  }, [isStreaming, alertColor]); // Re-bind เมื่อ state เปลี่ยน

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2>ระบบตรวจจับความง่วงผู้ขับขี่ (Driver Drowsiness Detection)</h2>
      
      {/* Status Box */}
      <div style={{ 
          padding: "20px", 
          backgroundColor: alertColor === "gray" ? "#ddd" : alertColor,
          color: alertColor === "yellow" || alertColor === "gray" ? "black" : "white", 
          borderRadius: "15px", 
          marginBottom: "20px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease"
      }}>
          <h1 style={{ margin: 0, fontSize: "2.5rem" }}>{statusText}</h1>
          <p style={{ margin: "10px 0 0 0", opacity: 0.8, fontSize: "1rem" }}>{debugInfo}</p>
      </div>

      {/* Video Area */}
      <div style={{ position: "relative", width: "640px", height: "480px", margin: "0 auto", border: "5px solid #333", borderRadius: "10px", overflow: "hidden" }}>
          <video 
            ref={videoRef} autoPlay playsInline muted
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", objectFit: "cover" }} 
          />
          <canvas 
            ref={canvasRef} 
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} 
          />
      </div>

      {/* Controls */}
      <div style={{ marginTop: "30px" }}>
        {!isStreaming ? 
            <button 
                onClick={() => { 
                    setIsStreaming(true); 
                    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
                        .then(stream => videoRef.current.srcObject = stream); 
                }} 
                style={{padding: "15px 40px", fontSize: "18px", cursor: "pointer", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "50px"}}
            >
                เริ่มทำงาน (Start)
            </button> 
            :
            <button 
                onClick={() => setIsStreaming(false)} 
                style={{padding: "15px 40px", fontSize: "18px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "50px"}}
            >
                หยุด (Stop)
            </button>
        }
      </div>
    </div>
  );
}

export default WebcamCapture;