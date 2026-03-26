import AVFoundation
import ExpoModulesCore

private let wakeWordDetectedEvent = "onWakeWordDetected"
private let wakeWordStatusEvent = "onWakeWordStatus"
private let wakeWordErrorEvent = "onWakeWordError"

public final class WaterwaysWakeWordModule: Module {
  private let audioEngine = AVAudioEngine()
  private let processingQueue = DispatchQueue(label: "com.waterways.wakeword.processing")

  private var converter: AVAudioConverter?
  private var targetFormat: AVAudioFormat?
  private var bridge: WaterwaysWakeWordBridge?
  private var listening = false
  private var threshold: Float = 0.8
  private var wakeWordLabel = "hey_wade"
  private var sampleRate: Double = 16_000
  private var windowSize: Int = 16_000
  private var hopSize: Int = 3_200
  private var cooldownMs: Double = 1_500
  private var lastDetectionAt: Double = 0

  public func definition() -> ModuleDefinition {
    Name("WaterwaysWakeWord")

    Events(wakeWordDetectedEvent, wakeWordStatusEvent, wakeWordErrorEvent)

    AsyncFunction("startListening") { (options: [String: Any]?, promise: Promise) in
      do {
        self.apply(options: options)
        let started = try self.startListeningInternal()
        promise.resolve(started)
      } catch {
        self.sendEvent(wakeWordErrorEvent, [
          "code": "start_failed",
          "message": error.localizedDescription,
        ])
        promise.reject(error)
      }
    }

    AsyncFunction("stopListening") { (promise: Promise) in
      self.stopListeningInternal()
      promise.resolve(nil)
    }

    Function("isListening") {
      self.listening
    }

    OnDestroy {
      self.stopListeningInternal()
    }
  }

  private func apply(options: [String: Any]?) {
    guard let options else {
      return
    }

    if let wakeWord = options["wakeWordLabel"] as? String, !wakeWord.isEmpty {
      wakeWordLabel = wakeWord
    }
    if let newThreshold = options["threshold"] as? Double {
      threshold = Float(max(0.0, min(1.0, newThreshold)))
    }
    if let newSampleRate = options["sampleRate"] as? Double, newSampleRate > 0 {
      sampleRate = newSampleRate
    }
    if let newWindowSize = options["windowSize"] as? Int, newWindowSize > 0 {
      windowSize = newWindowSize
    }
    if let newHopSize = options["hopSize"] as? Int, newHopSize > 0 {
      hopSize = newHopSize
    }
    if let newCooldownMs = options["cooldownMs"] as? Double, newCooldownMs >= 0 {
      cooldownMs = newCooldownMs
    }
  }

  private func startListeningInternal() throws -> Bool {
    if listening {
      return true
    }

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
    try session.setPreferredSampleRate(sampleRate)
    try session.setPreferredIOBufferDuration(0.02)
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let inputNode = audioEngine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)

    guard let mono16kFormat = AVAudioFormat(
      commonFormat: .pcmFormatFloat32,
      sampleRate: sampleRate,
      channels: 1,
      interleaved: false
    ) else {
      throw NSError(domain: "WakeWord", code: 1001, userInfo: [NSLocalizedDescriptionKey: "Unable to build target audio format"])
    }

    targetFormat = mono16kFormat
    converter = AVAudioConverter(from: inputFormat, to: mono16kFormat)

    bridge = WaterwaysWakeWordBridge(
      wakeWordLabel: wakeWordLabel,
      threshold: threshold,
      sampleRate: UInt(sampleRate),
      windowSize: UInt(windowSize),
      hopSize: UInt(hopSize)
    )
    bridge?.reset()

    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
      self?.handleInput(buffer: buffer)
    }

    audioEngine.prepare()
    try audioEngine.start()

    listening = true
    sendEvent(wakeWordStatusEvent, ["status": "listening", "message": "Wake-word listening started"])
    return true
  }

  private func stopListeningInternal() {
    if !listening {
      return
    }

    audioEngine.inputNode.removeTap(onBus: 0)
    audioEngine.stop()

    do {
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      sendEvent(wakeWordErrorEvent, ["code": "session_deactivate_failed", "message": error.localizedDescription])
    }

    converter = nil
    targetFormat = nil
    bridge = nil
    listening = false

    sendEvent(wakeWordStatusEvent, ["status": "idle", "message": "Wake-word listening stopped"])
  }

  private func handleInput(buffer: AVAudioPCMBuffer) {
    guard listening else {
      return
    }

    processingQueue.async { [weak self] in
      guard let self else {
        return
      }

      guard let converted = self.convert(buffer: buffer), let bridge else {
        return
      }

      guard let payload = bridge.processAudioBuffer(converted) else {
        return
      }

      let nowMs = Date().timeIntervalSince1970 * 1000.0
      if nowMs - lastDetectionAt < cooldownMs {
        return
      }
      lastDetectionAt = nowMs

      self.sendEvent(wakeWordDetectedEvent, payload)
    }
  }

  private func convert(buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
    guard let converter, let targetFormat else {
      return nil
    }

    let ratio = targetFormat.sampleRate / buffer.format.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1

    guard let outBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: capacity) else {
      return nil
    }

    var supplied = false
    var localError: NSError?

    let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
      if supplied {
        outStatus.pointee = .noDataNow
        return nil
      }
      supplied = true
      outStatus.pointee = .haveData
      return buffer
    }

    let status = converter.convert(to: outBuffer, error: &localError, withInputFrom: inputBlock)

    if status == .error || localError != nil {
      sendEvent(wakeWordErrorEvent, [
        "code": "converter_error",
        "message": localError?.localizedDescription ?? "Audio conversion failed",
      ])
      return nil
    }

    return outBuffer
  }
}
