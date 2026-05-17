const Detection = require('../models/Detection');
const MissingPerson = require('../models/MissingPerson');
const Notification = require('../models/Notification');
const Sighting = require('../models/Sighting');
const bot = require('../telegramBot');
const axios = require('axios');
const { SerialPort } = require('serialport');
const { isValidObjectId } = require('../utils/helpers');

// ==============================
// GSM SETUP
// ==============================
let gsmPort;

try {
  gsmPort = new SerialPort({
    path: process.env.SERIAL_PORT || "COM5",
    baudRate: 9600,
  });

  gsmPort.on('open', () => {
    console.log('📡 GSM SMS Module Connected');
  });

  gsmPort.on('error', (err) => {
    console.log('⚠️ GSM Error:', err.message);
  });

} catch (err) {
  console.log('⚠️ GSM not available');
}

// ==============================
// LOCATION CACHE
// ==============================
let cachedLocation = { lat: null, lon: null, timestamp: 0 };

async function getCurrentLocation() {
  const now = Date.now();

  if (cachedLocation.lat && (now - cachedLocation.timestamp < 30 * 60 * 1000)) {
    return cachedLocation;
  }

  try {
    const res = await axios.get(
      'http://ip-api.com/json/?fields=lat,lon,status,message',
      { timeout: 8000 }
    );

    if (res.data.status === "success") {
      cachedLocation = {
        lat: res.data.lat,
        lon: res.data.lon,
        timestamp: now
      };

      console.log(`📍 Real location fetched: ${res.data.lat}, ${res.data.lon}`);
      return cachedLocation;
    }
  } catch (error) {
    console.warn('⚠️ IP Geolocation failed:', error.message);
  }

  return { lat: 8.570883, lon: 39.281890 };
}

// ==============================
// SAFE SMS FUNCTION (FIXED)
// ==============================
function sendSMS(phone, message) {
  if (!gsmPort || !gsmPort.isOpen) {
    console.log('⚠️ GSM Port not open');
    return;
  }

  // HARD CLEAN MESSAGE (SIM900 SAFE)
  let cleanMessage = message
    .replace(/[^\x00-\x7F]/g, '') // remove emojis/non-ascii
    .replace(/\s+/g, ' ')         // remove extra spaces
    .trim();

  // LIMIT LENGTH (CRITICAL FIX)
  if (cleanMessage.length > 150) {
    cleanMessage = cleanMessage.substring(0, 150) + '...';
  }

  const command = `${phone}|${cleanMessage}\n`;

  console.log('📨 Sending to Arduino:', command);

  gsmPort.write(command, (err) => {
    if (err) {
      console.error('Write Error:', err.message);
    } else {
      console.log('✅ Command sent to Arduino');
    }
  });
}

// ==============================
// CREATE DETECTION
// ==============================
exports.createDetection = async (req, res) => {
  try {
    const {
      type,
      registrationId,
      name,
      detectionImage,
      confidence,
      behavior
    } = req.body;

    if (!registrationId || !detectionImage) {
      return res.status(400).json({
        success: false,
        message: 'registrationId and detectionImage are required'
      });
    }

    const matchedPerson = await MissingPerson.findById(registrationId)
      .populate('reportedBy');

    if (!matchedPerson) {
      return res.status(404).json({
        success: false,
        message: 'Missing person not found'
      });
    }

    const { lat, lon } = await getCurrentLocation();
    const locationString = `${lat}, ${lon}`;

    const mapsLink = `https://maps.google.com/?q=${lat},${lon}`;

    const detection = new Detection({
      type: type || 'Person',
      registrationId,
      name: name || `${matchedPerson.firstName} ${matchedPerson.lastName}`,
      location: locationString,
      latitude: lat,
      longitude: lon,
      locationLink: mapsLink,
      detectionImage,
      confidence: Number(confidence) || 0.6,
      behavior: behavior || 'Detected',
      priority: (confidence || 0) > 0.7 ? 'High' : 'Normal',
      status: 'Pending'
    });

    await detection.save();

    console.log(`✅ Detection saved for ${detection.name}`);

    const reporter = matchedPerson.reportedBy;

    // ===================== CREATE SIGHTING RECORD =====================
    if (reporter && reporter.userId && isValidObjectId(reporter.userId)) {
      try {
        const cctvSighting = new Sighting({
          user: reporter.userId,
          type: 'cctv',
          name: detection.name,
          description: `Automatic ML Detection via CCTV. Confidence: ${(confidence * 100).toFixed(1)}%`,
          location: {
            type: 'Point',
            coordinates: [lon, lat], // Longitude first for GeoJSON
            address: locationString
          },
          images: [detectionImage],
          caseId: registrationId,
          status: 'pending'
        });
        await cctvSighting.save();
        console.log('✅ CCTV Sighting record created');
      } catch (sightingErr) {
        console.error('❌ Error creating CCTV Sighting:', sightingErr.message);
      }
    }

    // ===================== IN-APP NOTIFICATION =====================
    if (reporter && reporter.userId && isValidObjectId(reporter.userId)) {
      try {
        await Notification.create({
          recipient: reporter.userId,
          title: 'ML Detection Match!',
          message: `The ML system detected a potential match for ${detection.name} at location: ${locationString} with ${(confidence * 100).toFixed(1)}% confidence.`,
          type: 'alert',
          priority: 'high'
        });
        console.log('✅ In-App Notification Sent');
      } catch (notifErr) {
        console.error('❌ In-App Notification Error:', notifErr.message);
      }
    }

    // ===================== TELEGRAM =====================
    if (reporter && reporter.telegramChatId) {

      const caption = `MISSING PERSON DETECTED!
Name: ${detection.name}
Location: ${locationString}
Confidence: ${(confidence * 100).toFixed(1)}%
Time: ${new Date().toLocaleString()}
Maps: ${mapsLink}`;

      try {
        const base64Data = detectionImage.replace(/^data:image\/\w+;base64,/, "");
        const photoBuffer = Buffer.from(base64Data, 'base64');

        await bot.sendPhoto(reporter.telegramChatId, photoBuffer, {
          caption,
          parse_mode: 'Markdown'
        });

        console.log('✅ Telegram Photo Alert Sent');

      } catch (err) {
        console.error('❌ Telegram Error:', err.message);
        await bot.sendMessage(reporter.telegramChatId, caption);
      }
    }

    // ===================== SMS (FIXED) =====================
    if (reporter && reporter.phone) {

      const smsMessage =
        `ALERT! ${detection.name} ` +
        `Conf:${(confidence * 100).toFixed(0)}% ` +
        `Loc:${lat},${lon} ` +
        `Map:${mapsLink}`;

      console.log("DEBUG - Sending SMS to:", reporter.phone);
      console.log("DEBUG - SMS Length:", smsMessage.length);
      console.log("DEBUG - SMS Content:", smsMessage);

      sendSMS(reporter.phone, smsMessage);

    } else {
      console.log('⚠️ No phone number found for reporter');
    }

    res.status(201).json({
      success: true,
      message: 'Detection saved successfully',
      data: detection
    });

  } catch (error) {
    console.error('Detection Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// GET DETECTIONS
// ==============================
exports.getDetections = async (req, res) => {
  try {
    const detections = await Detection.find().sort({ createdAt: -1 });
    res.json({ success: true, data: detections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// UPDATE DETECTION
// ==============================
exports.updateDetection = async (req, res) => {
  try {
    const { status } = req.body;

    const detection = await Detection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    detection.status = status || detection.status;
    await detection.save();

    res.json({
      success: true,
      message: 'Detection updated successfully',
      data: detection
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};