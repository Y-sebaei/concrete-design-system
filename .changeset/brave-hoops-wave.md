---
'@y-sebaei/concrete-ui': patch
---

Fix `Modal` ignoring Escape when it is pressed before focus has moved into the
dialog.

Escape was handled by a keydown listener on the dialog element, which only fires
once focus is inside it. Focus is moved in on the next animation frame, so there
was a window between the dialog mounting and that frame in which the keypress
landed on whatever had focus before and the dialog never saw it.

It is now handled on the document, guarded two ways: a keypress a control inside
the dialog has already called `preventDefault` on is left alone, so an open
Combobox closing its listbox on Escape no longer closes the dialog behind it as
well, and only the dialog opened last responds, so one Escape closes one dialog.
