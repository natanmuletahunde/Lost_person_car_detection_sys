import cv2
import requests
import numpy as np
import time
import base64
import logging
import easyocr

from ultralytics import YOLO
from datetime import datetime

# ==============================
# CONFIG
# ==============================
BASE_URL = "http://localhost:5000"

VEHICLE_API = f"{BASE_URL}/api/v1/missing-vehicles"
DETECTION_API = f"{BASE_URL}/api/v1/detections"

RTSP_URL = 0

# Minimum OCR confidence
MIN_PLATE_CONFIDENCE = 0.50

# Cooldown per vehicle
DETECTION_COOLDOWN = 20 * 60

# YOLO MODEL
YOLO_MODEL = "yolov8n.pt"

# Device Location Settings (Set to None for automatic client-side geolocation)
DEVICE_LATITUDE = None
DEVICE_LONGITUDE = None
DEVICE_LOCATION_NAME = None

# ==============================
# LOGGING
# ==============================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ==============================
# LOAD MODELS
# ==============================
model = YOLO(YOLO_MODEL)

reader = easyocr.Reader(['en'])

# ==============================
# CACHE
# ==============================
last_detection = {}

# ==============================
# UTILS
# ==============================
def get_device_location():
    """Gets exact location of the device using client-side geolocation."""
    if DEVICE_LATITUDE is not None and DEVICE_LONGITUDE is not None:
        return DEVICE_LATITUDE, DEVICE_LONGITUDE, DEVICE_LOCATION_NAME or f"{DEVICE_LATITUDE}, {DEVICE_LONGITUDE}"
    
    # 1. Try to fetch the latest high-accuracy location reported by the browser/PC to the backend
    try:
        res = requests.get(f"{BASE_URL}/api/v1/pc-location", timeout=5)
        if res.status_code == 200:
            data = res.json().get("data")
            if data and data.get("latitude") and data.get("longitude"):
                lat = data.get("latitude")
                lon = data.get("longitude")
                addr = data.get("address") or "Device Location"
                return lat, lon, addr
    except Exception as e:
        logging.warning(f"Failed to fetch high-accuracy location from backend: {e}")
    
    # 2. Secondary fallback: client-side IP-based approximation
    try:
        res = requests.get("http://ip-api.com/json/?fields=lat,lon,city,country", timeout=5)
        if res.status_code == 200:
            data = res.json()
            lat = data.get("lat")
            lon = data.get("lon")
            city = data.get("city", "")
            country = data.get("country", "")
            loc_name = f"{city}, {country}".strip(", ") or "CCTV Camera"
            return lat, lon, loc_name
    except Exception as e:
        logging.warning(f"Client geolocation failed: {e}")
        
    return None, None, None

def frame_to_base64(frame):

    _, buffer = cv2.imencode(
        ".jpg",
        frame,
        [cv2.IMWRITE_JPEG_QUALITY, 85]
    )

    return (
        "data:image/jpeg;base64,"
        + base64.b64encode(buffer).decode()
    )

# ==============================
# FETCH MISSING VEHICLES
# ==============================
def fetch_missing_vehicles():

    try:

        res = requests.get(
            VEHICLE_API,
            timeout=10
        )

        res.raise_for_status()

        data = res.json().get("data", [])

        logging.info(
            f"Fetched {len(data)} missing vehicles"
        )

        return data

    except Exception as e:

        logging.error(
            f"Vehicle fetch failed: {e}"
        )

        return []

# ==============================
# COOLDOWN CHECK
# ==============================
def should_send(plate):

    now = time.time()

    if plate in last_detection:

        elapsed = now - last_detection[plate]

        if elapsed < DETECTION_COOLDOWN:

            remaining = int(
                (DETECTION_COOLDOWN - elapsed) / 60
            )

            logging.info(
                f"⏳ Cooldown active for {plate}. "
                f"Wait {remaining} min"
            )

            return False

    last_detection[plate] = now

    return True

# ==============================
# OCR READ PLATE
# ==============================
def read_plate(vehicle_crop):

    try:

        results = reader.readtext(vehicle_crop)

        best_text = None
        best_conf = 0

        for result in results:

            text = result[1]
            conf = result[2]

            cleaned = (
                text.upper()
                .replace(" ", "")
                .replace("-", "")
            )

            if conf > best_conf:

                best_conf = conf
                best_text = cleaned

        return best_text, best_conf

    except Exception as e:

        logging.error(f"OCR Error: {e}")

        return None, 0

# ==============================
# SEND DETECTION
# ==============================
def send_detection(vehicle, plate, confidence, frame):

    lat, lon, loc_name = get_device_location()

    data = {

        "type": "Vehicle",

        "registrationId": str(vehicle["_id"]),

        "name": f"{vehicle.get('brand', '')} "
                f"{vehicle.get('model', '')}",

        "licensePlate": plate,

        "vehicleBrand": vehicle.get("brand"),

        "vehicleModel": vehicle.get("model"),

        "vehicleColor": vehicle.get("color"),

        "confidence": round(float(confidence), 2),

        "timestamp": (
            datetime.utcnow().isoformat() + "Z"
        ),

        "behavior": "Vehicle Detected",

        "priority": (
            "High"
            if confidence >= 0.85
            else "Normal"
        ),

        "detectionImage": frame_to_base64(frame)
    }

    if lat is not None and lon is not None:
        data["latitude"] = lat
        data["longitude"] = lon
        if loc_name:
            data["location"] = loc_name

    try:

        res = requests.post(
            DETECTION_API,
            json=data,
            timeout=10
        )

        if res.status_code in [200, 201]:

            logging.info(
                f"✅ VEHICLE DETECTED: "
                f"{plate}"
            )

        else:

            logging.warning(
                f"API ERROR: "
                f"{res.status_code}"
            )

    except Exception as e:

        logging.error(
            f"Detection send failed: {e}"
        )

# ==============================
# MAIN
# ==============================
def run_vehicle_system():

    vehicles = fetch_missing_vehicles()

    if not vehicles:

        logging.error(
            "No missing vehicles found"
        )

        return

    cap = cv2.VideoCapture(RTSP_URL)

    if not cap.isOpened():

        logging.error(
            "Cannot open camera"
        )

        return

    logging.info(
        "🚗 Vehicle Detection Started"
    )

    while True:

        ret, frame = cap.read()

        if not ret:
            continue

        # YOLO Detection
        results = model(frame)

        for result in results:

            boxes = result.boxes

            for box in boxes:

                cls = int(box.cls[0])

                # COCO classes
                # car=2 bus=5 truck=7 motorcycle=3

                if cls not in [2, 3, 5, 7]:
                    continue

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                vehicle_crop = frame[
                    y1:y2,
                    x1:x2
                ]

                if vehicle_crop.size == 0:
                    continue

                # OCR
                plate_text, plate_conf = read_plate(
                    vehicle_crop
                )

                if not plate_text:
                    continue

                logging.info(
                    f"Plate: {plate_text} "
                    f"({plate_conf:.2f})"
                )

                if plate_conf < MIN_PLATE_CONFIDENCE:
                    continue

                # MATCH DATABASE
                for vehicle in vehicles:

                    db_plate = (
                        str(vehicle.get("plateNumber", ""))
                        .upper()
                        .replace(" ", "")
                        .replace("-", "")
                    )

                    if db_plate == plate_text:

                        brand = vehicle.get("brand")
                        model_name = vehicle.get("model")

                        logging.info(
                            f"🚨 MATCH FOUND: "
                            f"{brand} {model_name}"
                        )

                        if should_send(db_plate):

                            send_detection(
                                vehicle,
                                plate_text,
                                plate_conf,
                                frame
                            )

                        # Draw rectangle
                        cv2.rectangle(
                            frame,
                            (x1, y1),
                            (x2, y2),
                            (0, 255, 0),
                            2
                        )

                        label = (
                            f"{brand} "
                            f"{model_name} "
                            f"{plate_text}"
                        )

                        cv2.putText(
                            frame,
                            label,
                            (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7,
                            (0, 255, 0),
                            2
                        )

        cv2.imshow(
            "Vehicle Detection",
            frame
        )

        if (
            cv2.waitKey(1) & 0xFF
            == ord('q')
        ):
            break

    cap.release()

    cv2.destroyAllWindows()

# ==============================
# START
# ==============================
if __name__ == "__main__":
    run_vehicle_system()