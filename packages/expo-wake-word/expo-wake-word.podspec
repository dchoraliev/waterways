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
    'HEADER_SEARCH_PATHS' => '$(inherited) $(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM) $(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk $(PODS_TARGET_SRCROOT)/../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM) $(PODS_TARGET_SRCROOT)/../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk'
  }

  s.source_files = [
    'ios/**/*.{h,m,mm,swift}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/**/*.{h,hpp,c,cc,cpp}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/model-parameters/**/*.{h,hpp,c,cc,cpp}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/tflite-model/**/*.{h,hpp,c,cc,cpp}',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/posix/ei_classifier_porting.cpp',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/model-parameters/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/tflite-model/**/*.{h,hpp,c,cc,cpp}',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/posix/ei_classifier_porting.cpp'
  ]

  s.exclude_files = [
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ambiq/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/android/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/arduino/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/brickml/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ceva-npn/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/clib/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/espressif/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ethos-core-driver/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/himax/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/himax-we2/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/iar/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/infineon-psoc62/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/mbed/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/mingw32/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/particle/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/raspberry/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/renesas-ra/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/seeed-vision-ai/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/silabs/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/sony/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/stm32-cubeai/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/synaptics/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ti/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/zephyr/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/cmake/**',
    '../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/CMSIS/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ambiq/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/android/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/arduino/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/brickml/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ceva-npn/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/clib/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/espressif/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ethos-core-driver/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/himax/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/himax-we2/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/iar/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/infineon-psoc62/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/mbed/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/mingw32/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/particle/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/raspberry/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/renesas-ra/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/seeed-vision-ai/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/silabs/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/sony/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/stm32-cubeai/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/synaptics/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/ti/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/porting/zephyr/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/cmake/**',
    '../../../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk/CMSIS/**'
  ]
end
