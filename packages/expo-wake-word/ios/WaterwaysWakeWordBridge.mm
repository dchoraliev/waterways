#import "WaterwaysWakeWordBridge.h"

#include <algorithm>
#include <cmath>
#include <vector>

#if __has_include("edge-impulse-sdk/classifier/ei_run_classifier.h") && \
    __has_include("model-parameters/model_variables.h")
#define WATERWAYS_EDGE_IMPULSE_ENABLED 1
#include "edge-impulse-sdk/classifier/ei_run_classifier.h"
#include "model-parameters/model_variables.h"
#else
#define WATERWAYS_EDGE_IMPULSE_ENABLED 0
#endif

namespace {
constexpr float kSilenceFloor = 1.0f;

#if WATERWAYS_EDGE_IMPULSE_ENABLED
thread_local const float *gSignalData = nullptr;

int signal_get_data(size_t offset, size_t length, float *out_ptr) {
  if (gSignalData == nullptr || out_ptr == nullptr) {
    return -1;
  }

  for (size_t i = 0; i < length; ++i) {
    out_ptr[i] = gSignalData[offset + i];
  }
  return 0;
}
#endif
}  // namespace

@interface WaterwaysWakeWordBridge () {
  std::vector<float> _ring;
  std::vector<float> _window;
  NSUInteger _windowSize;
  NSUInteger _hopSize;
  float _threshold;
  NSString *_wakeWordLabel;
}
@end

@implementation WaterwaysWakeWordBridge

- (instancetype)initWithWakeWordLabel:(NSString *)wakeWordLabel
                            threshold:(float)threshold
                           sampleRate:(NSUInteger)sampleRate
                           windowSize:(NSUInteger)windowSize
                              hopSize:(NSUInteger)hopSize {
  self = [super init];
  if (!self) {
    return nil;
  }

  _wakeWordLabel = [wakeWordLabel copy];
  _threshold = threshold;
  _windowSize = windowSize;
  _hopSize = hopSize;

  _ring.reserve(sampleRate * 2);
  _window.resize(windowSize);

#if WATERWAYS_EDGE_IMPULSE_ENABLED
  run_classifier_init();
#endif

  return self;
}

- (void)dealloc {
#if WATERWAYS_EDGE_IMPULSE_ENABLED
  run_classifier_deinit();
#endif
}

- (void)reset {
  _ring.clear();
#if WATERWAYS_EDGE_IMPULSE_ENABLED
  run_classifier_init();
#endif
}

- (nullable NSDictionary<NSString *, id> *)processAudioBuffer:(AVAudioPCMBuffer *)buffer {
  if (buffer.frameLength == 0 || buffer.floatChannelData == nullptr) {
    return nil;
  }

  float *channel = buffer.floatChannelData[0];
  const size_t frameCount = (size_t)buffer.frameLength;

  float energy = 0.0f;
  _ring.insert(_ring.end(), channel, channel + frameCount);

  for (size_t i = 0; i < frameCount; ++i) {
    energy += std::fabs(channel[i]);
  }

  if ((energy / (float)frameCount) < kSilenceFloor / 32768.0f) {
    while (_ring.size() > (_windowSize * 2)) {
      _ring.erase(_ring.begin(), _ring.begin() + _hopSize);
    }
    return nil;
  }

  NSDictionary<NSString *, id> *detectedPayload = nil;

  while (_ring.size() >= _windowSize) {
    std::copy_n(_ring.begin(), _windowSize, _window.begin());

#if WATERWAYS_EDGE_IMPULSE_ENABLED
    signal_t signal;
    signal.total_length = _windowSize;
    signal.get_data = &signal_get_data;

    ei_impulse_result_t result;
    memset(&result, 0, sizeof(result));

    gSignalData = _window.data();
    uint64_t started = ei_read_timer_ms();
    EI_IMPULSE_ERROR err = run_classifier(&signal, &result, false);
    uint64_t ended = ei_read_timer_ms();
    gSignalData = nullptr;

    if (err == EI_IMPULSE_OK && result.classification != nullptr) {
      float wakeConfidence = 0.0f;
      for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; ++i) {
        const char *label = result.classification[i].label;
        if (label != nullptr && _wakeWordLabel && strcmp(label, _wakeWordLabel.UTF8String) == 0) {
          wakeConfidence = result.classification[i].value;
          break;
        }
      }

      if (wakeConfidence >= _threshold) {
        detectedPayload = @{
          @"label" : _wakeWordLabel,
          @"confidence" : @(wakeConfidence),
          @"inferenceMs" : @((double)(ended - started)),
          @"timestamp" : @([[NSDate date] timeIntervalSince1970] * 1000.0)
        };
      }
    }
#endif

    if (_ring.size() <= _hopSize) {
      _ring.clear();
    } else {
      _ring.erase(_ring.begin(), _ring.begin() + _hopSize);
    }

    if (detectedPayload != nil) {
      return detectedPayload;
    }
  }

  return nil;
}

@end
