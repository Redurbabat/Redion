import WidgetKit
import SwiftUI

// REDION ORBIT
// A genuinely native iPhone widget, not a fake looping webpage animation.
// WidgetKit renders snapshots: the orbit advances on a modest three-hour
// timeline, and iOS animates only the brief transitions between snapshots.
// No personal notes, document titles, network requests or App Group reads.

private enum RedionPalette {
    static let night = Color(red: 0.060, green: 0.066, blue: 0.105)
    static let plum = Color(red: 0.140, green: 0.095, blue: 0.245)
    static let violet = Color(red: 0.678, green: 0.510, blue: 1.000)
    static let teal = Color(red: 0.360, green: 0.865, blue: 0.900)
    static let peach = Color(red: 1.000, green: 0.714, blue: 0.545)
    static let white = Color(red: 0.965, green: 0.964, blue: 1.000)
}

struct RedionWidgetEntry: TimelineEntry {
    let date: Date
    let phase: Int
}

struct RedionWidgetProvider: TimelineProvider {
    private func entry(at date: Date) -> RedionWidgetEntry {
        RedionWidgetEntry(date: date, phase: Calendar.current.component(.hour, from: date) / 3)
    }

    func placeholder(in context: Context) -> RedionWidgetEntry {
        entry(at: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (RedionWidgetEntry) -> Void) {
        completion(entry(at: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RedionWidgetEntry>) -> Void) {
        let now = Date()
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: now)
        let nextHour = (calendar.component(.hour, from: now) / 3 + 1) * 3
        // WidgetKit is budgeted and may defer a refresh. These are planned,
        // discreet palette/position changes, NOT continuous animation.
        let next = (0..<9).compactMap { index -> RedionWidgetEntry? in
            guard let date = calendar.date(byAdding: .hour, value: nextHour + index * 3, to: start) else {
                return nil
            }
            return entry(at: date)
        }
        completion(Timeline(entries: [entry(at: now)] + next, policy: .atEnd))
    }
}

struct RedionDestination: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
    let tint: Color
}

private let destinations: [RedionDestination] = [
    RedionDestination(id: "dokumente", title: "Dokumente", subtitle: "Deine Ideen",
                      symbol: "doc.text", tint: RedionPalette.violet),
    RedionDestination(id: "heute", title: "Heute", subtitle: "Dein Moment",
                      symbol: "sun.max", tint: RedionPalette.teal),
    RedionDestination(id: "lernen", title: "Lernen", subtitle: "Dein Wissen",
                      symbol: "book.closed", tint: RedionPalette.peach)
]

// MARK: - Orbit artwork: all native SwiftUI shapes, no external bitmaps.
//
// The reference images use planets, glowing edge light and orbital rings.
// This is the matching live WidgetKit composition rather than a static mock:
// compact vector layers, deterministic star positions, no downloads/timers.

private struct RedionPlanet: View {
    let diameter: CGFloat
    let phase: Int
    let accent: Color

    var body: some View {
        ZStack {
            Circle()
                .fill(RadialGradient(stops: [
                    .init(color: Color(red: 0.19, green: 0.25, blue: 0.50), location: 0),
                    .init(color: RedionPalette.plum, location: 0.34),
                    .init(color: RedionPalette.night, location: 0.75),
                    .init(color: Color.black.opacity(0.98), location: 1)
                ], center: UnitPoint(x: 0.25, y: 0.18),
                startRadius: 2, endRadius: diameter * 0.74))

            // Planet rim: a brighter sunrise edge towards the top right.
            Circle()
                .stroke(AngularGradient(colors: [
                    accent.opacity(0.02), RedionPalette.teal.opacity(0.34),
                    RedionPalette.white.opacity(0.88), RedionPalette.peach.opacity(0.95),
                    RedionPalette.violet.opacity(0.34), accent.opacity(0.04)
                ], center: .center, angle: .degrees(28)), lineWidth: 1.5)

            Circle()
                .trim(from: 0.03, to: 0.29)
                .stroke(AngularGradient(colors: [
                    RedionPalette.peach.opacity(0.05), RedionPalette.peach,
                    RedionPalette.violet.opacity(0.70)
                ], center: .center), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .blur(radius: 5)
                .rotationEffect(.degrees(Double(phase) * 3 - 12))

            Circle()
                .fill(RadialGradient(colors: [
                    RedionPalette.teal.opacity(0.33), .clear
                ], center: .center, startRadius: 0, endRadius: diameter * 0.27))
                .frame(width: diameter * 0.46, height: diameter * 0.46)
                .offset(x: -diameter * 0.29, y: -diameter * 0.31)
                .blur(radius: 4)
        }
        .frame(width: diameter, height: diameter)
        .clipShape(Circle())
        .shadow(color: accent.opacity(0.34), radius: 13)
        .accessibilityHidden(true)
    }
}

private struct RedionOrbitBackdrop: View {
    let phase: Int
    let reducedMotion: Bool

    private var position: Int { reducedMotion ? 0 : phase % 8 }
    private var rotation: Double { Double(position) * 5.0 }

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            let size = max(width, height)
            ZStack {
                LinearGradient(colors: [
                    RedionPalette.plum, RedionPalette.night,
                    Color(red: 0.034, green: 0.050, blue: 0.105)
                ], startPoint: .topLeading, endPoint: .bottomTrailing)

                // Screenprinted nebula: subtle radial haloes that do not
                // obscure the text or navigation hit regions.
                Circle()
                    .fill(RadialGradient(colors: [
                        RedionPalette.violet.opacity(0.39), .clear
                    ], center: .center, startRadius: 1, endRadius: size * 0.45))
                    .frame(width: size * 0.92, height: size * 0.92)
                    .position(x: width * 0.83, y: height * 0.15)

                Circle()
                    .fill(RadialGradient(colors: [
                        RedionPalette.teal.opacity(0.25), .clear
                    ], center: .center, startRadius: 0, endRadius: size * 0.32))
                    .frame(width: size * 0.70, height: size * 0.70)
                    .position(x: width * 0.15, y: height * 0.78)

                // Planetary bodies scale with the actual widget bounds.
                // The right edge is deliberately cut off like the preview.
                RedionPlanet(diameter: size * 0.66,
                             phase: position, accent: RedionPalette.violet)
                    .position(x: width * (0.91 - CGFloat(position) * 0.005),
                              y: height * 0.02)

                RedionPlanet(diameter: size * 0.31,
                             phase: position, accent: RedionPalette.teal)
                    .position(x: width * 0.37, y: height * 0.28)
                    .opacity(0.75)

                // Glowing orbital paths, rather than free-running rotation.
                Ellipse()
                    .stroke(AngularGradient(colors: [
                        RedionPalette.teal.opacity(0.05),
                        RedionPalette.teal.opacity(0.90),
                        RedionPalette.white.opacity(0.28),
                        RedionPalette.peach.opacity(0.85),
                        RedionPalette.violet.opacity(0.04)
                    ], center: .center), lineWidth: 1.2)
                    .frame(width: size * 1.27, height: size * 0.55)
                    .rotationEffect(.degrees(-20 + rotation))
                    .position(x: width * 0.55, y: height * 0.52)
                    .shadow(color: RedionPalette.teal.opacity(0.60), radius: 4)

                Ellipse()
                    .trim(from: 0.05, to: 0.64)
                    .stroke(AngularGradient(colors: [
                        RedionPalette.violet.opacity(0.04),
                        RedionPalette.peach.opacity(0.80),
                        RedionPalette.violet.opacity(0.75),
                        RedionPalette.teal.opacity(0.05)
                    ], center: .center),
                    style: StrokeStyle(lineWidth: 0.85, lineCap: .round))
                    .frame(width: size * 1.10, height: size * 0.39)
                    .rotationEffect(.degrees(27 - rotation * 0.6))
                    .position(x: width * 0.47, y: height * 0.45)

                // Stable, non-random star field; no network or animation loop.
                ForEach(0..<19, id: \.self) { index in
                    Circle()
                        .fill(RedionPalette.white.opacity(index.isMultiple(of: 4) ? 0.65 : 0.24))
                        .frame(width: index.isMultiple(of: 5) ? 2 : 1,
                               height: index.isMultiple(of: 5) ? 2 : 1)
                        .position(x: width * CGFloat((index * 43 + 17) % 97) / 100,
                                  y: height * CGFloat((index * 29 + 11) % 91) / 100)
                }

                Circle()
                    .fill(RadialGradient(colors: [
                        RedionPalette.white, RedionPalette.teal, RedionPalette.violet
                    ], center: .topLeading, startRadius: 0, endRadius: 12))
                    .frame(width: 13, height: 13)
                    .position(x: width * 0.71, y: height * 0.13)
                    .shadow(color: RedionPalette.teal.opacity(0.9), radius: 7)
            }
            .frame(width: width, height: height)
            .clipped()
            .animation(reducedMotion ? nil : .easeInOut(duration: 0.9), value: position)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - Reusable typography and navigation.

private struct RedionSignature: View {
    var compact = false

    var body: some View {
        HStack(spacing: 7) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(RedionPalette.violet.opacity(0.20))
                    .overlay {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(RedionPalette.violet.opacity(0.45), lineWidth: 0.7)
                    }
                Image(systemName: "sparkle")
                    .font(.system(size: compact ? 14 : 16, weight: .semibold))
                    .foregroundStyle(RedionPalette.white)
            }
            .frame(width: compact ? 30 : 34, height: compact ? 30 : 34)

            Text("REDION")
                .font(.system(size: compact ? 11 : 12, weight: .heavy, design: .rounded))
                .tracking(2.0)
                .foregroundStyle(RedionPalette.white)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct RedionDestinationTile: View {
    let destination: RedionDestination
    let vertical: Bool

    private var url: URL {
        // Every id is a compile-time literal from the allowlisted destinations.
        URL(string: "redion://widget/" + destination.id)!
    }

    var body: some View {
        Link(destination: url) {
            Group {
                if vertical {
                    HStack(spacing: 11) {
                        icon
                        VStack(alignment: .leading, spacing: 2) {
                            Text(destination.title)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                            Text(destination.subtitle)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(RedionPalette.white.opacity(0.62))
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(RedionPalette.white.opacity(0.68))
                    }
                } else {
                    VStack(alignment: .leading, spacing: 7) {
                        HStack {
                            icon
                            Spacer(minLength: 0)
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundStyle(RedionPalette.white.opacity(0.50))
                        }
                        Text(destination.title)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .lineLimit(1)
                            .minimumScaleFactor(0.82)
                    }
                }
            }
            .foregroundStyle(RedionPalette.white)
            .padding(vertical ? 11 : 9)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: 15, style: .continuous)
                    .fill(RedionPalette.white.opacity(0.085))
                    .overlay {
                        RoundedRectangle(cornerRadius: 15, style: .continuous)
                            .stroke(RedionPalette.white.opacity(0.15), lineWidth: 0.7)
                    }
            }
            .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
        }
        .accessibilityLabel(destination.title + " in Redion öffnen")
    }

    private var icon: some View {
        Image(systemName: destination.symbol)
            .font(.system(size: vertical ? 17 : 15, weight: .medium))
            .foregroundStyle(destination.tint)
            .frame(width: 24, height: 24)
    }
}

// MARK: - Sizes: one tap on small, three separate paths on medium/large.

private struct RedionOrbitWidgetView: View {
    let entry: RedionWidgetEntry

    @Environment(\.widgetFamily) private var family
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .topLeading) {
            RedionOrbitBackdrop(phase: entry.phase, reducedMotion: reduceMotion)

            Group {
                switch family {
                case .systemSmall:
                    smallLayout
                case .systemLarge:
                    largeLayout
                default:
                    mediumLayout
                }
            }
            // Leave room for the 3 separate touch zones even on compact
            // iPhone widget sizes; older iOS versions add system margins.
            .padding(11)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetBackground()
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.8), value: entry.phase)
        .accessibilityElement(children: .contain)
    }

    private var smallLayout: some View {
        VStack(alignment: .leading, spacing: 8) {
            RedionSignature(compact: true)
            Spacer(minLength: 2)
            Image(systemName: "sparkles.rectangle.stack")
                .font(.system(size: 32, weight: .ultraLight))
                .foregroundStyle(RedionPalette.teal)
                .accessibilityHidden(true)
            Spacer(minLength: 2)
            Text("Ein Gedanke.")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(RedionPalette.white)
                .minimumScaleFactor(0.75)
                .lineLimit(1)
            HStack {
                Text("Heute öffnen")
                Spacer(minLength: 0)
                Image(systemName: "arrow.up.right")
            }
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(RedionPalette.white.opacity(0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetURL(URL(string: "redion://widget/heute"))
        .accessibilityLabel("Redion – Heute öffnen")
    }

    private var mediumLayout: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .center) {
                RedionSignature()
                Spacer(minLength: 0)
                Text("DEIN RAUM")
                    .font(.system(size: 8, weight: .bold, design: .rounded))
                    .tracking(1.6)
                    .foregroundStyle(RedionPalette.white.opacity(0.67))
            }

            Text("Drei Wege. Alles deins.")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(RedionPalette.white.opacity(0.94))
                .lineLimit(1)

            HStack(spacing: 7) {
                ForEach(destinations) { destination in
                    RedionDestinationTile(destination: destination, vertical: false)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var largeLayout: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack {
                RedionSignature()
                Spacer()
                Image(systemName: "circle.hexagongrid")
                    .foregroundStyle(RedionPalette.teal.opacity(0.75))
                    .accessibilityHidden(true)
            }
            Spacer(minLength: 6)
            Text("Ideen finden.\nWissen bewegen.")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(RedionPalette.white)
                .lineSpacing(2)
                .minimumScaleFactor(0.75)
                .fixedSize(horizontal: false, vertical: true)
            Text("Dein Raum für das, was zählt.")
                .font(.system(size: 11))
                .foregroundStyle(RedionPalette.white.opacity(0.70))
            Spacer(minLength: 2)
            VStack(spacing: 8) {
                ForEach(destinations) { destination in
                    RedionDestinationTile(destination: destination, vertical: true)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct RedionQuickWidget: Widget {
    let kind = "RedionQuickWidget"

    var body: some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            configuration.contentMarginsDisabled()
        } else {
            // iOS 15/16 use system-provided widget safe-area padding.
            configuration
        }
    }

    private var configuration: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RedionWidgetProvider()) { entry in
            RedionOrbitWidgetView(entry: entry)
        }
        .configurationDisplayName("Redion Orbit")
        .description("Dein Redion – drei direkte Wege, ruhige Farbphasen und sanfte Übergänge.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

private extension View {
    @ViewBuilder func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(RedionPalette.night, for: .widget)
        } else {
            background(RedionPalette.night)
        }
    }
}

@main
struct RedionWidgets: WidgetBundle {
    var body: some Widget {
        RedionQuickWidget()
    }
}
