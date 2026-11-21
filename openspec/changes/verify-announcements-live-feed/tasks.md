# Tasks

## 1. Live feed in the editor

- [ ] 1.1 In the announcements repository, commit `announcements/<today>-vpe-live-check.md` with `title: VPE live check`, `level: info`, `testing: true`, `apps: [vpe]`, `expires: <tomorrow>` and a one-paragraph body. Wait for the publish workflow to finish and verify `https://geneontology.github.io/noctua-announcements/announcements.json` lists it.
- [ ] 1.2 Run `npm run dev` and open `http://localhost:4208/?model_id=<model id>` (or switch back to an already open tab). Verify that within about five minutes, or immediately on returning focus to the tab, a blue floating card titled `VPE live check` drops in over the top of the editor without moving the toolbars, and the bell shows a red badge.
- [ ] 1.3 Add `announcements/<today>-sae-only-check.md` with `apps: [sae]`, `testing: true`, and `announcements/<yesterday>-expired-check.md` with `apps: [vpe]`, `testing: true`, `starts: <two days ago>`, `expires: <yesterday>`. After publishing, verify neither appears on the card or in the panel (click the bell and check the `Notifications` list).
- [ ] 1.4 Click `Got it` on the `VPE live check` card. Verify the card disappears and the bell still counts it as unread. Reload the page; verify the card does not come back and the panel still lists `VPE live check` as unread.
- [ ] 1.5 Remove the test announcement files from the announcements repository and verify after the next publish that the editor's panel no longer lists them.
