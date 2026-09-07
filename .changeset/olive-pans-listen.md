---
'@y-sebaei/concrete-ui': minor
---

Add `Banner`, an inline message about a condition.

A toast reports an event: something happened, you may have missed it, here it is
for six seconds. A banner reports a state that is true right now and stays on
screen until it stops being true. The test is whether the message is still true
in a minute.

This came out of building the console, which had to report degraded search in a
toast because there was nothing else. The message was gone six seconds later
while still being true.

Five tones, an optional dismiss and one action slot. `role="alert"` for the
danger tone and `role="status"` for the rest, with `announce={false}` for a
banner that is part of the page from the start. Colour is never the only
carrier: a 3px bar in the full tone colour meets the 3:1 in WCAG 1.4.11 that the
tinted background cannot, a drawn glyph backs it up, and the title says what
happened.
