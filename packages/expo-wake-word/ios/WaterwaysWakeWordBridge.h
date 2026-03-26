#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface WaterwaysWakeWordBridge : NSObject

- (instancetype)initWithWakeWordLabel:(NSString *)wakeWordLabel
                            threshold:(float)threshold
                           sampleRate:(NSUInteger)sampleRate
                           windowSize:(NSUInteger)windowSize
                              hopSize:(NSUInteger)hopSize;

- (void)reset;

- (nullable NSDictionary<NSString *, id> *)processAudioBuffer:(AVAudioPCMBuffer *)buffer;

@end

NS_ASSUME_NONNULL_END
