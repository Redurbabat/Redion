#!/usr/bin/env ruby
# Adds two extension targets ONLY to Capacitor's generated Xcode project.
# Requires xcodeproj 1.27+ (on macOS: gem install xcodeproj).
# The version-controlled ios/ sources and the existing app ID stay untouched.
require 'fileutils'
require 'xcodeproj'

root = File.expand_path('..', __dir__)
ios = File.join(root, 'build/ios-capacitor/App')
project_path = File.join(ios, 'App.xcodeproj')
abort 'Capacitor Xcode project is missing' unless File.file?(File.join(project_path, 'project.pbxproj'))

project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' && t.product_type == 'com.apple.product-type.application' }
abort 'Unexpected Capacitor App target' unless app
abort 'Redion extensions already installed' if project.targets.any? { |t| %w[RedionShare RedionWidgets].include?(t.name) }

configs = {
  'RedionShare' => {
    'source' => 'ios/share-extension/RedionShareViewController.swift',
    'swift' => 'RedionShareViewController.swift',
    'plist' => 'ios/share-extension/Info.plist',
    'entitlements' => 'ios/share-extension/RedionShare.entitlements',
    'bundle' => 'ch.redurbabat.redion.share'
  },
  'RedionWidgets' => {
    'source' => 'ios/widgets/RedionWidgets.swift',
    'swift' => 'RedionWidgets.swift',
    'plist' => 'ios/widgets/Info.plist',
    'bundle' => 'ch.redurbabat.redion.widgets'
  }
}

# Validate the complete, generated and tracked inputs BEFORE creating
# extension targets. An extension never modifies the tracked source tree.
plist = File.join(ios, 'App/App/Info.plist')
abort 'Generated app Info.plist is missing' unless File.file?(plist)
host_info = Xcodeproj::Plist.read_from_path(plist)
abort 'Unexpected host Info.plist format' unless host_info.is_a?(Hash)
url_types = host_info.fetch('CFBundleURLTypes', [])
abort 'Unexpected CFBundleURLTypes structure' unless url_types.is_a?(Array) &&
  url_types.all? { |entry| entry.is_a?(Hash) && entry.fetch('CFBundleURLSchemes', []).is_a?(Array) }
abort 'Redion URL scheme already installed' if url_types.any? { |entry|
  entry.fetch('CFBundleURLSchemes', []).include?('redion')
}

configs.each do |name, conf|
  abort "Missing extension source for #{name}" unless File.file?(File.join(root, conf['source']))
  extension_info = Xcodeproj::Plist.read_from_path(File.join(root, conf['plist']))
  required_point = name == 'RedionShare' ? 'com.apple.share-services' : 'com.apple.widgetkit-extension'
  abort "Invalid extension point for #{name}" unless
    extension_info.dig('NSExtension', 'NSExtensionPointIdentifier') == required_point
  if conf['entitlements']
    entitlements = Xcodeproj::Plist.read_from_path(File.join(root, conf['entitlements']))
    host_entitlements = Xcodeproj::Plist.read_from_path(
      File.join(root, 'ios/share-extension/RedionApp.entitlements'))
    group_id = 'group.ch.redurbabat.redion.share'
    abort 'Share and host must use identical App Group' unless
      entitlements['com.apple.security.application-groups'] == [group_id] &&
      host_entitlements['com.apple.security.application-groups'] == [group_id]
  end
end

# Copy checked-in templates into the disposable generated project ONLY.
configs.each do |name, conf|
  directory = File.join(ios, name)
  abort "Generated extension folder already exists: #{name}" if File.exist?(directory)
  FileUtils.mkdir_p(directory)
  FileUtils.cp(File.join(root, conf['source']), File.join(directory, conf['swift']))
  FileUtils.cp(File.join(root, conf['plist']), File.join(directory, 'Info.plist'))
  if conf['entitlements']
    FileUtils.cp(File.join(root, conf['entitlements']), File.join(directory, 'RedionShare.entitlements'))
  end
end
FileUtils.mkdir_p(File.join(ios, 'RedionApp'))
FileUtils.cp(File.join(root, 'ios/share-extension/RedionApp.entitlements'),
             File.join(ios, 'RedionApp/RedionApp.entitlements'))

embed = app.copy_files_build_phases.find { |phase| phase.name == 'Embed App Extensions' } ||
        app.new_copy_files_build_phase('Embed App Extensions')
embed.dst_subfolder_spec = '13' # PlugIns
embed.dst_path = ''
configs.each do |name, conf|
  target = project.new_target(:app_extension, name, :ios, '15.0')
  dir = project.main_group.find_subpath(name, true)
  dir.source_tree = '<group>'
  dir.path = name
  swift = dir.new_file(conf['swift'])
  dir.new_file('Info.plist')
  dir.new_file('RedionShare.entitlements') if conf['entitlements']
  target.source_build_phase.add_file_reference(swift)
  target.build_configurations.each do |configuration|
    settings = configuration.build_settings
    settings['SWIFT_VERSION'] = '5.0'
    settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    settings['PRODUCT_BUNDLE_IDENTIFIER'] = conf['bundle']
    settings['INFOPLIST_FILE'] = name + '/Info.plist'
    settings['GENERATE_INFOPLIST_FILE'] = 'NO'
    settings['SKIP_INSTALL'] = 'YES'
    settings['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
    settings['TARGETED_DEVICE_FAMILY'] = '1,2'
    settings['CODE_SIGN_ENTITLEMENTS'] = name + '/RedionShare.entitlements' if conf['entitlements']
  end
  app.add_dependency(target)
  embedded = embed.add_file_reference(target.product_reference, true)
  embedded.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }
end

app.build_configurations.each do |configuration|
  configuration.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'RedionApp/RedionApp.entitlements'
end

# Preserve any Capacitor or plugin-provided URL registrations.
# Both Xcode targets and the changed host plist were validated above.
host_info['CFBundleURLTypes'] = url_types + [{
  'CFBundleURLName' => 'ch.redurbabat.redion',
  'CFBundleURLSchemes' => ['redion']
}]
Xcodeproj::Plist.write_to_path(host_info, plist)
project.save

# Check the saved target and embedded product relationships, not merely
# the presence of filenames in the generated Xcode project.
verified = Xcodeproj::Project.open(project_path)
host = verified.targets.find { |target| target.name == 'App' }
names = host.copy_files_build_phases.flat_map { |phase|
  phase.files.map { |file| file.file_ref&.display_name }
}.compact
%w[RedionShare.appex RedionWidgets.appex].each do |name|
  abort "Extension is not embedded in App: #{name}" unless names.include?(name)
end
puts 'Redion iOS: Share Extension and WidgetKit targets verified in generated Xcode project.'
