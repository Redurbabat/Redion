# History and Recovery Audit

Test destructive and reversible workflows from the user's recovery perspective.

Verify:
- undo/redo availability matches reality;
- operation grouping is understandable;
- new edits after undo branch correctly;
- save/sync failure does not discard work;
- version restore can itself be recovered when appropriate;
- multi-selection edits undo as coherent transactions;
- navigation/close does not lose unsaved data;
- offline-to-online transitions preserve edits;
- collaboration/conflict behavior is explicit.

A successful happy-path save test is not sufficient evidence of recoverability.