require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
ei_root = File.expand_path('../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)', __dir__)

Pod::Spec.new do |s|
  s.name           = 'expo-wake-word'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
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
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM) $(PODS_TARGET_SRCROOT)/../../ai-wade-assistance-cpp-mcu-v8(lessRAMandROM)/edge-impulse-sdk',
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) EIDSP_SIGNAL_C_FN_POINTER=1'
  }

  s.source_files = [
    'ios/**/*.{h,m,mm,swift}',
    "#{ei_root}/edge-impulse-sdk/**/*.{h,hpp,c,cc,cpp}",
    "#{ei_root}/model-parameters/**/*.{h,hpp,c,cc,cpp}",
    "#{ei_root}/tflite-model/**/*.{h,hpp,c,cc,cpp}"
  ]

  s.exclude_files = [
    "#{ei_root}/edge-impulse-sdk/porting/**",
    "#{ei_root}/edge-impulse-sdk/cmake/**",
    "#{ei_root}/edge-impulse-sdk/CMSIS/**"
  ]
end
