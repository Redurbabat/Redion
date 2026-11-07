# Connectors and Diagram Relationships

Connectors represent relationships between objects, not decorative lines.

## Model
Store endpoints by stable object/port identity plus routing metadata. Moving a connected object updates the connector without breaking the relationship.

## Interaction
Expose valid connection targets during creation. Snap only when intent is clear. Support selection, deletion, rerouting and endpoint reassignment.

Orthogonal, straight and curved routing are product choices. Avoid crossings where automatic routing can improve comprehension, but never make routing changes that obscure user intent.

Touch/stylus need larger invisible hit areas than the visible stroke. Keyboard users need an alternate way to create/edit essential relationships.