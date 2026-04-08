require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'expo-wake-word'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = 'Native iOS wake-word detection module that streams microphone audio into Edge Impulse inference and emits Expo events.'
  s.homepage       = 'https://waterways.app'
  s.license        = 'Proprietary'
  s.author         = 'Waterways'
  s.platform       = :ios, '15.1'
  s.source         = { git: 'https://example.invalid/local-only' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.swift_version = '5.9'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'HEADER_SEARCH_PATHS' => '$(inherited) $(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM) $(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk $(PODS_TARGET_SRCROOT)/../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM) $(PODS_TARGET_SRCROOT)/../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk',
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) EIDSP_SIGNAL_C_FN_POINTER=1'
  }

  s.source_files = [
    'ios/**/*.{h,m,mm,swift}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/**/*.{h,hpp,c,cc,cpp}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/model-parameters/**/*.{h,hpp,c,cc,cpp}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/tflite-model/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/model-parameters/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/tflite-model/**/*.{h,hpp,c,cc,cpp}'
  ]

  s.exclude_files = [
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/cmake/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/CMSIS/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/cmake/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/CMSIS/**'
  ]
end
