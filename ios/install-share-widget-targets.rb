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

# Copy checked-in templates to the generated project first. It is disposable,
# so the main app's tracked ios/ files are never overwritten or deleted.
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

# A supported, trusted app-only URL scheme for the navigation widget.
plist = File.join(ios, 'App/App/Info.plist')
abort 'Generated app Info.plist missing' unless File.file?(plist)
abort 'Redion URL scheme already installed' if File.read(plist).include?('<string>redion</string>')
project.save
plutil = '/usr/libexec/PlistBuddy'
commands = [
  'Add :CFBundleURLTypes array',
  'Add :CFBundleURLTypes:0 dict',
  'Add :CFBundleURLTypes:0:CFBundleURLName string ch.redurbabat.redion',
  'Add :CFBundleURLTypes:0:CFBundleURLSchemes array',
  'Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string redion'
]
commands.each do |command|
  abort "Could not register Redion URL scheme: #{command}" unless system(plutil, '-c', command, plist)
end
puts 'Redion iOS: Share Extension and WidgetKit targets added to generated Xcode project.'
