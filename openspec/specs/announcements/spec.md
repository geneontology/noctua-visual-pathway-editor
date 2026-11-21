# announcements Specification

## Purpose
Put announcements written by the announcement author in front of curators: read the shared Markdown-authored feed, keep only what applies to this editor right now, and present it as a pinned strip, a floating banner, a notification bell and a notifications panel, remembering per browser what each curator has dismissed and read.

## Requirements

### Requirement: Shared announcement feed
The system SHALL read announcements from the shared published feed (by default `https://geneontology.github.io/noctua-announcements/announcements.json`, overridable by the host page without a rebuild), bypassing the browser cache so a fresh copy is read every time.

#### Scenario: Host page overrides the feed
- **WHEN** the host page sets a different announcements address before the editor loads
- **THEN** the editor reads announcements from that address

### Requirement: Feed kept fresh in a long-lived tab
The system SHALL re-read the feed every five minutes, when the browser window regains focus, and when the network reconnects.

#### Scenario: New announcement while the editor is open
- **WHEN** a new announcement is published while the curator has the editor open
- **THEN** it appears within five minutes, or as soon as the curator returns to the tab

### Requirement: Announcements never block the editor
The system SHALL treat a feed that cannot be fetched or read as having no announcements, and the editor SHALL load and work normally.

#### Scenario: Feed unavailable
- **WHEN** the feed request fails
- **THEN** no banner, strip or panel rows are shown and the editor works normally
- **AND** the bell is still shown

### Requirement: Only announcements for this editor
The system SHALL show only announcements whose target apps include `vpe`.

#### Scenario: Announcement for another app
- **WHEN** an announcement targets only `landing-page` and `sae`
- **THEN** it does not appear anywhere in the editor

### Requirement: Testing announcements stay off production
The system SHALL show an announcement marked `testing` only on non-production builds; production builds SHALL never show it.

#### Scenario: Testing announcement on production
- **WHEN** a `testing` announcement is in the feed and the editor is a production build
- **THEN** it does not appear

#### Scenario: Testing announcement on the dev site
- **WHEN** a `testing` announcement is in the feed and the editor is a non-production build
- **THEN** it appears like any other announcement

### Requirement: Scheduling window
The system SHALL show an announcement only from its `starts` moment until its `expires` moment. A date without a time SHALL mean the whole of that day in the viewer's own timezone, so `expires` runs to the end of that day inclusive; a value with a time SHALL be taken as an absolute instant. A missing `starts` means already started; a missing `expires` means never expires.

#### Scenario: Whole-day expiry
- **WHEN** an announcement has `expires: 2026-03-14`
- **THEN** it is shown throughout 14 March in the viewer's timezone and gone from local midnight

#### Scenario: Not yet started
- **WHEN** an announcement's `starts` is in the future
- **THEN** it is not shown anywhere

### Requirement: Schedule boundaries applied on time
The system SHALL re-evaluate the announcement list at the next `starts` or `expires` moment of any announcement in the feed, so an announcement appears or disappears at that moment without waiting for a reload or the next feed read.

#### Scenario: 4pm maintenance notice
- **WHEN** an announcement starts at 16:00 and the editor is open at 15:59
- **THEN** it appears at 16:00

### Requirement: Pinned announcement strip
The system SHALL show the first pinned active announcement as a full-width strip above the top toolbar that pushes the editor down and cannot be closed. It SHALL show the type icon, title, description, a "More details" link when the announcement has one, and a "View more" button, coloured by level.

#### Scenario: Pinned announcement
- **WHEN** an active announcement is pinned
- **THEN** a strip with its title and description sits above the top toolbar with no close control
- **AND** the rest of the editor starts below the strip

### Requirement: Floating announcement banner
The system SHALL show the first active, non-pinned announcement in feed order that this browser has not dismissed as a floating card centred over the top of the editor, without moving the layout. The card SHALL show the type icon, title, up to two lines of description, "Got it", "More details" when a link exists, "View more", and a close button labelled "Close announcement", coloured by level. It SHALL drop in with a short animation unless the viewer prefers reduced motion.

#### Scenario: Banner shown
- **WHEN** an active non-pinned announcement has not been dismissed in this browser
- **THEN** it floats over the top of the editor as a card
- **AND** the toolbars and canvas do not move

#### Scenario: Pinned announcements are never on the card
- **WHEN** the only active announcement is pinned
- **THEN** no floating card is shown

### Requirement: Dismissing the banner
The system SHALL dismiss the banner's announcement when the curator clicks "Got it" or the close button: it SHALL never appear on the banner again in this browser, it SHALL remain unread in the panel, and the next undismissed announcement, if any, SHALL take its place.

#### Scenario: Got it
- **WHEN** the curator clicks "Got it" on the banner
- **THEN** the card disappears and the next undismissed announcement drops in
- **AND** the dismissed announcement is still listed as unread in the panel

#### Scenario: Close button
- **WHEN** the curator clicks the banner's close button
- **THEN** the result is the same as "Got it"

### Requirement: Announcement state remembered per browser
The system SHALL remember which announcements have been dismissed and which read in this browser across reloads. If that memory cannot be read, every announcement SHALL be treated as new and undismissed; if it cannot be written, the change SHALL still apply for the current session.

#### Scenario: Reload after dismissing
- **WHEN** the curator dismisses a banner and reloads the page
- **THEN** that announcement does not appear on the banner again

### Requirement: View more opens the announcement in the panel
The system SHALL open the notifications panel on the announcement when the curator clicks "View more" on the banner or the pinned strip, with that announcement expanded and marked read.

#### Scenario: View more on the banner
- **WHEN** the curator clicks "View more" on the floating card
- **THEN** the notifications panel opens with that announcement expanded and no longer unread

### Requirement: Notification bell
The system SHALL always show a bell in the top toolbar, even with no announcements, that opens the notifications panel. When any shown announcement is unread the bell SHALL carry a red badge with the unread count. Its accessible name SHALL be "<unread> unread of <total> announcements", "<total> announcement" or "<total> announcements" when all are read, or "No announcements".

#### Scenario: Unread announcements
- **WHEN** two of three active announcements are unread
- **THEN** the bell shows a badge "2" and is named "2 unread of 3 announcements"

#### Scenario: Nothing to show
- **WHEN** there are no active announcements
- **THEN** the bell is still shown, with no badge, named "No announcements"

### Requirement: Notifications panel
The system SHALL show a "Notifications" drawer on the right listing every active announcement for this editor, dismissed or not. Each collapsed row SHALL show the type icon tinted by level, an unread dot when unread, the title, a pin mark when pinned, an age stamp, and one line of description.

#### Scenario: Panel lists dismissed announcements
- **WHEN** the curator has dismissed an announcement's banner and opens the panel
- **THEN** that announcement is still listed

### Requirement: Expanding a row
The system SHALL expand one row at a time in the panel to show the announcement's full formatted body and a "More details" link when one exists. Expanding a row SHALL mark it read.

#### Scenario: Expanding another row
- **WHEN** one row is expanded and the curator expands a second
- **THEN** the first collapses, the second shows its full body, and the second is marked read

### Requirement: Panel ordering
The system SHALL list unread announcements first and read ones after them under a "Read" heading with a count. Within each group, pinned announcements SHALL come first, then newest first by created date, where the created date is the date at the start of the announcement's id, or its `starts` when the id has none. Pinned announcements SHALL always be listed with the unread ones.

#### Scenario: Mixed list
- **WHEN** the panel holds a pinned announcement, two unread ones created on 1 and 10 March, and one read one
- **THEN** the order is the pinned one, the 10 March one, the 1 March one, then the "Read (1)" heading and the read one

### Requirement: Marking read and unread
The system SHALL give every unread, non-pinned row a "Mark as read" control that moves it under Read at once, and every row under Read a "Mark as unread" control. Pinned rows SHALL have neither. Marking an announcement unread SHALL NOT bring back its banner.

#### Scenario: Mark as unread
- **WHEN** the curator marks a read announcement whose banner was dismissed as unread
- **THEN** it returns to the unread group and the bell badge
- **AND** its banner does not reappear

### Requirement: Rows read by expanding stay in place
The system SHALL keep a row that became read by expanding it, or through "View more", in its current place until the panel is next opened, so it does not jump away while being read.

#### Scenario: Reading a row
- **WHEN** the curator expands an unread row
- **THEN** it stays in the unread group, without its unread dot, until the panel is closed and reopened

### Requirement: Show read switch
The system SHALL offer a "Show read" switch in the panel header, on by default and remembered in this browser, that hides the Read section when off. With nothing unread the panel SHALL show "You're all caught up" above any Read section.

#### Scenario: Hiding read announcements
- **WHEN** the curator turns "Show read" off and reloads
- **THEN** the panel opens with the switch off and no Read section

#### Scenario: All caught up
- **WHEN** every announcement is read
- **THEN** the panel shows "You're all caught up"

### Requirement: Age stamp
The system SHALL label each panel row with the age of its created date: "today", "yesterday", "<n>d" under a week, "<n>w" under a month, "<n>mo" under a year, otherwise "<n>y", and "now" when the announcement has no created date.

#### Scenario: Two-week-old announcement
- **WHEN** an announcement's id starts with a date 15 days ago
- **THEN** its row shows "2w"

### Requirement: Panel text size
The system SHALL render panel descriptions, bodies, links, age stamps and section headings at the editor's standard body text size, with row titles one step larger and the panel title larger again, and SHALL mute rows under Read with solid greys that keep text contrast at least 4.5:1.

#### Scenario: Reading the panel
- **WHEN** the curator opens the panel
- **THEN** its body text is the same size as the rest of the editor's body text

### Requirement: Level colours and type icons
The system SHALL colour announcements by level, info blue, success green, warning yellow and danger red, falling back to info for an unknown level, and SHALL give each type its own icon (announcement, update, reminder, maintenance, event), falling back to the announcement icon for an unknown type.

#### Scenario: Danger maintenance notice
- **WHEN** a `danger` announcement of type `maintenance` is shown
- **THEN** its banner is red and carries the maintenance icon
