# Tasks

## 1. Overlay in the browser (#235)

- [ ] 1.1 Run `npm run dev` and open `http://localhost:4208/?model_id=<editable model id>&barista_token=<token>` with DevTools network throttling at "Slow 3G". Verify a grey full-screen overlay with a spinner and `Loading Model Activities...` covers the page while the model loads, then clears about one second after the graph appears.
- [ ] 1.2 Open an activity in the drawer, add evidence through the annotation dialog and click `Save`, then immediately click `Save` again. Verify the overlay shows `Saving...` over the dialog, the second click does nothing, the Network tab shows a single change request to Barista, and the overlay switches to `Loading Model Activities...` while the model reloads before clearing.
- [ ] 1.3 Choose `Delete Activity` from the drawer's ellipsis menu and confirm. Verify the overlay shows `Deleting...` and clears about one second after the activity disappears from the canvas.
- [ ] 1.4 Click the copy-model button in the model toolbar, give a title and confirm. Verify the overlay shows `Copying Model...` and clears when the copy finishes.
- [ ] 1.5 Set DevTools to "Offline" and click `Save` on an open form. Verify the overlay appears, then clears about one second after the request fails and the page is clickable again (no stuck overlay). Set the network back to "No throttling".
