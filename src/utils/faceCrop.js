import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

const VISION_VERSION = '1.0.1'
const WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite'

let detectorPromise = null
let detectorBroken = false

async function getDetector() {
  if (detectorBroken) return null
  detectorPromise ??= FilesetResolver.forVisionTasks(WASM_PATH).then((fileset) =>
    FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: 'IMAGE',
      // Profile and upward captures score lower than the front view, so match
      // the relaxed thresholds the backend retries with.
      minDetectionConfidence: 0.3,
    }),
  )
  try {
    return await detectorPromise
  } catch (error) {
    detectorBroken = true
    detectorPromise = null
    console.warn('[SmartCCTV] Face detection is unavailable, cropping the centre instead.', error)
    return null
  }
}

/** The centre of the capture guide, which is where the student is told to look. */
function centreBox(canvas) {
  const width = Math.round(canvas.width * 0.45)
  const height = Math.round(canvas.height * 0.6)
  return {
    x: Math.max(0, Math.round((canvas.width - width) / 2)),
    y: Math.max(0, Math.round((canvas.height - height) / 3)),
    width,
    height,
  }
}

function clampBox(canvas, box) {
  const x = Math.max(0, Math.min(canvas.width - 1, box.x))
  const y = Math.max(0, Math.min(canvas.height - 1, box.y))
  return {
    x,
    y,
    width: Math.max(1, Math.min(canvas.width - x, box.width)),
    height: Math.max(1, Math.min(canvas.height - y, box.height)),
  }
}

function cropCanvas(source, box) {
  const out = document.createElement('canvas')
  out.width = box.width
  out.height = box.height
  out.getContext('2d').drawImage(source, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)
  return out
}

/**
 * Crop a full-frame capture down to the face, padded by the same 20%/25% the
 * backend uses before it computes embeddings. `previousBox` is reused when this
 * angle has no fresh detection, since the student sits in the same spot for all
 * four captures.
 *
 * Returns the cropped canvas, the box it came from, and `detected` — false when
 * the crop came from the fallback rather than from a face.
 */
export async function cropToFace(frame, previousBox = null) {
  const detector = await getDetector()
  const faces = detector ? (detector.detect(frame).detections ?? []).filter((face) => face.boundingBox) : []
  if (faces.length === 0) {
    const fallback = previousBox ?? centreBox(frame)
    return { canvas: cropCanvas(frame, fallback), box: fallback, detected: false }
  }

  const face = faces.reduce((best, item) => {
    const area = item.boundingBox.width * item.boundingBox.height
    return area > best.area ? { box: item.boundingBox, area } : best
  }, { box: null, area: -1 }).box

  const padded = clampBox(frame, {
    x: face.originX - Math.round(face.width * 0.2),
    y: face.originY - Math.round(face.height * 0.25),
    width: Math.round(face.width * 1.4),
    height: Math.round(face.height * 1.5),
  })
  return { canvas: cropCanvas(frame, padded), box: padded, detected: true }
}

export default cropToFace
