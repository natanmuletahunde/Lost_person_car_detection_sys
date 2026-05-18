import cv2
import face_recognition
import requests
import os
import numpy as np
import time
import base64
from datetime import datetime
import logging

# ==============================
# CONFIG
# ==============================
BASE_URL = "http://localhost:5000"
PERSON_API = f"{BASE_URL}/api/v1/missing-persons"
DETECTION_API = f"{BASE_URL}/api/v1/detections"

RTSP_URL = 0
SAVE_DIR = "database"

# Face Recognition Settings
CONFIDENCE_THRESHOLD = 0.6
MIN_SEND_CONFIDENCE = 0.70

# Wait 20 minutes before sending same person again
DETECTION_COOLDOWN = 20 * 60

# Performance Settings
SKIP_FRAMES = 10
RESIZE_SCALE = 0.5

# Device Location Settings (Set to None for automatic client-side geolocation)
DEVICE_LATITUDE = None
DEVICE_LONGITUDE = None
DEVICE_LOCATION_NAME = None

os.makedirs(SAVE_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

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


# Stores last detection time for each person
last_detection = {}

def should_send(person_id):

    if not person_id:
        return True

    now = time.time()

    # Check cooldown
    if person_id in last_detection:

        elapsed = now - last_detection[person_id]

        if elapsed < DETECTION_COOLDOWN:

            remaining = int(
                (DETECTION_COOLDOWN - elapsed) / 60
            )

            logging.info(
                f"⏳ Duplicate skipped for "
                f"{person_id}. "
                f"Wait {remaining} more minute(s)."
            )

            return False

    # Save detection time
    last_detection[person_id] = now

    return True


# ==============================
# FETCH MISSING PERSONS
# ==============================
def fetch_missing_persons():

    try:
        res = requests.get(
            PERSON_API,
            timeout=10
        )

        res.raise_for_status()

        data = res.json().get("data", [])

        logging.info(
            f"Fetched {len(data)} persons"
        )

        return data

    except Exception as e:

        logging.error(
            f"Fetch failed: {e}"
        )

        return []


# ==============================
# DOWNLOAD PERSON IMAGES
# ==============================
def process_and_save_images(persons):

    saved = []

    for person in persons:

        name = (
            f"{person.get('firstName', '')} "
            f"{person.get('lastName', '')}"
        ).strip()

        for i, img_path in enumerate(
            person.get("images", [])
        ):

            if not img_path:
                continue

            # Build full image URL
            if not img_path.startswith("http"):

                normalized_path = (
                    img_path
                    .replace("\\", "/")
                    .lstrip("/")
                )

                full_url = (
                    f"{BASE_URL}/{normalized_path}"
                )

            else:
                full_url = img_path

            try:

                r = requests.get(
                    full_url,
                    timeout=10
                )

                r.raise_for_status()

                path = os.path.join(
                    SAVE_DIR,
                    f"{name.replace(' ', '_')}_{i}.jpg"
                )

                with open(path, "wb") as f:
                    f.write(r.content)

                saved.append(
                    (name, path, person)
                )

                logging.info(
                    f"Saved image: {name}"
                )

            except Exception as e:

                logging.warning(
                    f"Download failed: {e}"
                )

    return saved


# ==============================
# CREATE FACE ENCODINGS
# ==============================
def load_encodings(saved):

    encodings = []
    names = []
    refs = []

    for name, path, person in saved:

        try:

            img = face_recognition.load_image_file(
                path
            )

            enc = face_recognition.face_encodings(
                img
            )

            if enc:

                encodings.append(enc[0])

                names.append(name)

                refs.append(person)

                logging.info(
                    f"Encoded: {name}"
                )

        except Exception as e:

            logging.error(
                f"Encoding failed: {e}"
            )

    return encodings, names, refs


# ==============================
# SEND DETECTION
# ==============================
def send_detection(
    person_id,
    name,
    confidence,
    frame
):

    if not person_id:
        return

    lat, lon, loc_name = get_device_location()

    data = {
        "type": "Person",
        "registrationId": str(person_id),
        "name": name,
        "timestamp": (
            datetime.utcnow().isoformat() + "Z"
        ),
        "confidence": round(
            float(confidence),
            2
        ),
        "priority": (
            "High"
            if confidence >= 0.85
            else "Normal"
        ),
        "behavior": "Detected",
        "detectionImage": frame_to_base64(
            frame
        )
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
                f"✅ SENT: {name} "
                f"({confidence:.2f})"
            )

        else:

            logging.warning(
                f"⚠️ API Response: "
                f"{res.status_code}"
            )

    except Exception as e:

        logging.error(
            f"Send failed: {e}"
        )


# ==============================
# MAIN SYSTEM
# ==============================
def run_system():

    # Fetch persons
    persons = fetch_missing_persons()

    # Download images
    saved = process_and_save_images(
        persons
    )

    # Encode faces
    encodings, names, refs = load_encodings(
        saved
    )

    if not encodings:

        logging.error(
            "No encodings created!"
        )

        return

    logging.info(
        f"✅ System ready with "
        f"{len(encodings)} encodings"
    )

    # Open camera
    cap = cv2.VideoCapture(
        RTSP_URL
    )

    cap.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        640
    )

    cap.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        480
    )

    if not cap.isOpened():

        logging.error(
            "Cannot open camera!"
        )

        return

    logging.info(
        "🎥 Camera started"
    )

    frame_count = 0

    while True:

        ret, frame = cap.read()

        if not ret or frame is None:
            continue

        frame_count += 1

        # Skip frames
        if frame_count % SKIP_FRAMES != 0:

            cv2.imshow(
                "Security Feed",
                frame
            )

            if (
                cv2.waitKey(1) & 0xFF
                == ord('q')
            ):
                break

            continue

        # Resize frame
        small_frame = cv2.resize(
            frame,
            (0, 0),
            fx=RESIZE_SCALE,
            fy=RESIZE_SCALE
        )

        rgb_small = cv2.cvtColor(
            small_frame,
            cv2.COLOR_BGR2RGB
        )

        # Detect faces
        face_locs = (
            face_recognition.face_locations(
                rgb_small
            )
        )

        face_encs = (
            face_recognition.face_encodings(
                rgb_small,
                face_locs
            )
        )

        # Process faces
        for (
            (top, right, bottom, left),
            face_encoding
        ) in zip(face_locs, face_encs):

            # Scale coordinates back
            top = int(top / RESIZE_SCALE)
            right = int(right / RESIZE_SCALE)
            bottom = int(bottom / RESIZE_SCALE)
            left = int(left / RESIZE_SCALE)

            # Compare with known faces
            distances = (
                face_recognition.face_distance(
                    encodings,
                    face_encoding
                )
            )

            best_match_index = np.argmin(
                distances
            )

            distance = distances[
                best_match_index
            ]

            # Match found
            if distance < CONFIDENCE_THRESHOLD:

                confidence = 1 - distance

                name = names[
                    best_match_index
                ]

                person = refs[
                    best_match_index
                ]

                person_id = (
                    person.get("_id")
                    or person.get("id")
                )

                logging.info(
                    f"🎯 MATCH FOUND: "
                    f"{name} "
                    f"({confidence:.2f})"
                )

                # Only send if >= 70%
                if (
                    confidence
                    >= MIN_SEND_CONFIDENCE
                ):

                    logging.info(
                        f"✅ Accepted "
                        f"({confidence:.2f})"
                    )

                    # Cooldown protection
                    if should_send(person_id):

                        send_detection(
                            person_id,
                            name,
                            confidence,
                            frame
                        )

                    color = (0, 255, 0)

                    label = (
                        f"{name} "
                        f"{confidence:.2f}"
                    )

                else:

                    logging.info(
                        f"⚠️ Low confidence "
                        f"ignored "
                        f"({confidence:.2f})"
                    )

                    color = (0, 165, 255)

                    label = (
                        f"Low Confidence "
                        f"{confidence:.2f}"
                    )

            else:

                # Unknown face
                color = (0, 0, 255)

                label = (
                    f"Unknown "
                    f"{distance:.2f}"
                )

            # Draw rectangle
            cv2.rectangle(
                frame,
                (left, top),
                (right, bottom),
                color,
                2
            )

            # Draw label
            cv2.putText(
                frame,
                label,
                (left, top - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2
            )

        # Show video
        cv2.imshow(
            "Security Feed",
            frame
        )

        # Quit
        if (
            cv2.waitKey(1) & 0xFF
            == ord('q')
        ):
            break

    # Cleanup
    cap.release()

    cv2.destroyAllWindows()


# ==============================
# START
# ==============================
if __name__ == "__main__":
    run_system()