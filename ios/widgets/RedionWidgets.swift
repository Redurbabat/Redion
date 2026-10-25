import WidgetKit
import SwiftUI

// Only navigation. No notes, filenames or private metadata on lock screens.
struct RedionWidgetEntry: TimelineEntry {
    let date: Date
}

struct RedionWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> RedionWidgetEntry {
        RedionWidgetEntry(date: Date())
    }
    func getSnapshot(in context: Context, completion: @escaping (RedionWidgetEntry) -> Void) {
        completion(RedionWidgetEntry(date: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<RedionWidgetEntry>) -> Void) {
        completion(Timeline(entries: [RedionWidgetEntry(date: Date())], policy: .never))
    }
}

struct RedionDestination: Identifiable {
    let id: String
    let title: String
    let symbol: String
}
private let destinations = [
    RedionDestination(id: "dokumente", title: "Dokumente", symbol: "doc.text"),
    RedionDestination(id: "heute", title: "Heute", symbol: "calendar"),
    RedionDestination(id: "lernen", title: "Lernen", symbol: "book")
]

struct RedionQuickWidget: Widget {
    let kind = "RedionQuickWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RedionWidgetProvider()) { _ in
            VStack(alignment: .leading, spacing: 9) {
                Text("Redion").font(.headline)
                ForEach(destinations) { destination in
                    Link(destination: URL(string: "redion://widget/" + destination.id)!) {
                        Label(destination.title, systemImage: destination.symbol)
                            .font(.callout)
                    }
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        }
        .configurationDisplayName("Redion öffnen")
        .description("Dokumente, Heute und Lernen direkt öffnen.")
        .supportedFamilies([.systemMedium])
    }
}

extension View {
    @ViewBuilder func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(Color(red: 0.09, green: 0.10, blue: 0.12), for: .widget)
                .foregroundColor(.white)
        } else {
            background(Color(red: 0.09, green: 0.10, blue: 0.12))
                .foregroundColor(.white)
        }
    }
}

@main
struct RedionWidgets: WidgetBundle {
    var body: some Widget {
        RedionQuickWidget()
    }
}
