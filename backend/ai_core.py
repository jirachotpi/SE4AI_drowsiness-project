# import cv2
# import mediapipe as mp
# import numpy as np

# mp_face_mesh = mp.solutions.face_mesh
# face_mesh = mp_face_mesh.FaceMesh(
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5
# )

# LEFT_EYE = [362, 385, 387, 263, 373, 380]
# RIGHT_EYE = [33, 160, 158, 133, 153, 144]

# def calculate_ear(landmarks, indices, img_w, img_h):
#     coords = np.array([[landmarks[idx].x * img_w, landmarks[idx].y * img_h] for idx in indices])
#     v1 = np.linalg.norm(coords[1] - coords[5])
#     v2 = np.linalg.norm(coords[2] - coords[4])
#     h = np.linalg.norm(coords[0] - coords[3])
#     return (v1 + v2) / (2.0 * h)

# def process_frame(image_bytes):
#     try:
#         nparr = np.frombuffer(image_bytes, np.uint8)
#         frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#         if frame is None: return {"status": "error"}

#         h, w, _ = frame.shape
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = face_mesh.process(rgb_frame)

#         if not results.multi_face_landmarks:
#             return {"status": "no_face", "ear": 0.0, "face_box": None}

#         for face_landmarks in results.multi_face_landmarks:
#             landmarks = face_landmarks.landmark
            
#             # คำนวณ EAR
#             left_ear = calculate_ear(landmarks, LEFT_EYE, w, h)
#             right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
#             avg_ear = (left_ear + right_ear) / 2.0

#             # สร้างกรอบหน้า (Face Box)
#             x_coords = [lm.x for lm in landmarks]
#             y_coords = [lm.y for lm in landmarks]
#             face_box = [
#                 int(min(x_coords) * w), 
#                 int(min(y_coords) * h), 
#                 int((max(x_coords) - min(x_coords)) * w), 
#                 int((max(y_coords) - min(y_coords)) * h)
#             ]

#             return {
#                 "status": "success",
#                 "ear": float(round(avg_ear, 3)),
#                 # Threshold 0.21 คือจุดกลางที่ดีสำหรับคนเอเชีย (ไม่ต่ำเกินจนจับยาก ไม่สูงเกินจนเตือนมั่ว)
#                 "is_eye_closed": bool(avg_ear < 0.21), 
#                 "face_box": face_box
#             }
            
#     except Exception as e:
#         return {"status": "error", "message": str(e)}
#     return {"status": "error"}