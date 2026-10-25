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
  dir.set_source_tree('<group>')
  dir.set_path(name)
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
  embed.add_file_reference(target.product_reference, true)
end

app.build_configurations.each do |configuration|
  configuration.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'RedionApp/RedionApp.entitlements'
end

# Widgets open only the three existing destinations via a custom URL scheme.
# For Swift to handle links, the host App must advertise its own URL scheme.
# Prefer a native plist edit rather than touching Capacitor's Web routes.
plist = File.join(ios, 'App/App/Info.plist')
abort 'Generated app Info.plist is missing' unless File.file?(plist)
require 'rexml/document'
doc = REXML::Document.new(File.read(plist))
dict = doc.elements['plist/dict']
abort 'Unexpected App Info.plist' unless dict
# Append CFBundleURLTypes without deleting existing iOS config.
key = dict.add_element('key')
key.text = 'CFBundleURLTypes'
array = dict.add_element('array')
urltype = array.add_element('dict')
n = urltype.add_element('key')
n.text = 'CFBundleURLName'
v = urltype.add_element('string')
v.text = 'ch.redurbabat.redion'
n = urltype.add_element('key')
n.text = 'CFBundleURLSchemes'
a = urltype.add_element('array')
v = a.add_element('string')
v.text = 'redion'
File.open(plist, 'w') { |f| doc.write(f, 2) }
project.save
puts 'Redion iOS: Share Extension and WidgetKit targets added to generated Xcode project.'
