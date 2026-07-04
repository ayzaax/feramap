# FeraMap — Manual Testing Matrix

All testing performed manually on physical devices via Expo Go.

**Test Environment:**
- Android: physical device (Android 14) via Expo Go
- iOS: physical device (iOS 17) via Expo Go
- Supabase project: production instance with seed data

**Legend:**  
- Status: PASS / FAIL / N/A  
- Priority: P0 (critical), P1 (important), P2 (nice-to-have)

---

## 1. Authentication

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 1.1 | Sign up with valid email + password | 1. Open app → LoginScreen. 2. Tap "Make one". 3. Enter new email and matching passwords. 4. Tap "Create account". | Account created, session starts, onboarding shows. | P0 | PASS |
| 1.2 | Sign up with mismatched passwords | 1. Enter email. 2. Enter password. 3. Enter different confirm password. 4. Tap "Create account". | Error "Passwords do not match." shown. Form stays open. | P1 | PASS |
| 1.3 | Sign up with already registered email | 1. Enter an email that already has an account. 2. Enter passwords. 3. Tap "Create account". | Error message from Supabase displayed (e.g., "User already registered"). | P1 | PASS |
| 1.4 | Log in with valid credentials | 1. Enter registered email and correct password. 2. Tap "Login". | Session starts, user lands on Map screen (or onboarding if profile incomplete). | P0 | PASS |
| 1.5 | Log in with wrong password | 1. Enter registered email and wrong password. 2. Tap "Login". | Error message displayed. User stays on login screen. | P1 | PASS |
| 1.6 | Log in with empty fields | 1. Leave email or password empty. 2. Tap "Login". | Error message displayed. No crash. | P2 | PASS |
| 1.7 | Session persistence | 1. Log in. 2. Kill the app. 3. Reopen. | User goes directly to Map screen without re-entering credentials. | P0 | PASS |
| 1.8 | Logout | 1. Go to Profile tab. 2. Tap "Log Out". | Session cleared. Login screen shows. | P0 | PASS |

---

## 2. Onboarding

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.1 | Complete onboarding | 1. After sign up, onboarding appears. 2. Choose avatar. 3. Enter display name. 4. Select colony. 5. Tap "Let's Go!". | Profile saved. Main app (tabs) appears. | P0 | PASS |
| 2.2 | Submit without display name | 1. Leave name field empty. 2. Tap "Let's Go!". | Button disabled / alert shown. Stays on onboarding. | P1 | PASS |
| 2.3 | Submit without colony selection | 1. Enter name. 2. Do not select colony. 3. Tap "Let's Go!". | Alert "Colony Required" displayed. | P1 | PASS |
| 2.4 | Avatar selection updates preview | 1. Tap different avatar options. | Selected avatar shows check badge and scales up. "You picked: [name]" updates. | P2 | PASS |

---

## 3. Map Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.1 | Map loads with cat markers | 1. Navigate to Map tab. | Map centres near Ciudad Lerdo. Coloured cat markers appear. | P0 | PASS |
| 3.2 | Filter by status | 1. Tap "Spotted" filter chip. | Only orange (spotted) markers remain. Tap "All" → all markers return. | P1 | PASS |
| 3.3 | Tap marker opens callout | 1. Tap a cat marker. | Callout shows cat name. | P1 | PASS |
| 3.4 | Callout tap navigates to profile | 1. Tap the callout bubble. | CatProfileScreen opens for that cat. | P1 | PASS |
| 3.5 | Bottom sheet shows nearby cats | 1. Observe bottom sheet. | Horizontal scrollable list of cat names with photo thumbnails. | P2 | PASS |
| 3.6 | FAB opens report flow | 1. Tap purple "+" button (bottom right). | Report modal stack opens at LocationScreen. | P0 | PASS |
| 3.7 | Map refreshes on focus | 1. Report a new cat. 2. Return to Map tab. | Newly reported cat marker appears without manual refresh. | P1 | PASS |
| 3.8 | GPS permission denied fallback | 1. Deny location permission when prompted. | Map defaults to Ciudad Lerdo coordinates. Blue dot not shown. App does not crash. | P1 | PASS |
| 3.9 | User location blue dot shown | 1. Allow location permission. | Blue dot shows user's current position on map. | P2 | PASS |

---

## 4. Report Flow

### 4.1 Location Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.1.1 | GPS auto-detection | 1. Open report (tap +). 2. Allow location. | Map centres on user's actual GPS. Pin emoji at centre. | P0 | PASS |
| 4.1.2 | Manual pin adjustment | 1. Drag the map. | Pin stays at centre; underlying map moves. New coordinates stored. | P1 | PASS |
| 4.1.3 | GPS denied fallback | 1. Deny location when prompted. | Map defaults to 25.5428, -103.4068. Subtitle says "GPS Denied. Adjust map manually." | P1 | PASS |
| 4.1.4 | Continue to next step | 1. Tap "Looks right →". | Navigates to IdentifyScreen with location data. | P0 | PASS |

### 4.2 Identify Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.2.1 | Nearby cats displayed | 1. Arrive at IdentifyScreen. | Up to 2 known cats listed, plus "This is a new cat!" option. | P0 | PASS |
| 4.2.2 | Select existing cat | 1. Tap radio on a known cat. 2. Tap "Continue →". | Navigates to Camera with catId and catName in params. | P1 | PASS |
| 4.2.3 | Select new cat | 1. Select "This is a new cat!". 2. Tap "Continue →". | Navigates to Camera without catId. | P0 | PASS |
| 4.2.4 | No cats in database | 1. Start with empty database. | Only "This is a new cat!" option shown. Header shows "0 cats known nearby." | P2 | PASS |

### 4.3 Camera Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.3.1 | Take photo with camera | 1. Tap "Open camera". 2. Take a photo. | Navigates to DetailsScreen with photoUri. | P0 | PASS |
| 4.3.2 | Pick from gallery | 1. Tap "Pick from gallery". 2. Select an image. | Navigates to DetailsScreen with photoUri. | P0 | PASS |
| 4.3.3 | Camera permission denied | 1. Deny camera permission. 2. Tap "Open camera". | Nothing happens. App does not crash. | P1 | PASS |
| 4.3.4 | Cancel photo capture | 1. Open camera. 2. Press back/cancel in native camera UI. | Stays on CameraScreen. | P2 | PASS |

### 4.4 Details Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.4.1 | Submit new cat with all fields | 1. Enter name. 2. Select condition (Healthy). 3. Add notes. 4. Tap "Report cat". | Cat created. Sighting inserted. Photo uploaded. Navigate to Success. | P0 | PASS |
| 4.4.2 | Submit without selecting condition | 1. Fill name and notes. 2. Do NOT select condition. 3. Observe button state. | Button disabled. Cannot submit. | P1 | PASS |
| 4.4.3 | Submit with injured condition | 1. Select "Injured". 2. Tap "Report urgently". | Cat created with priority = Urgent. Button text shows "Report urgently". | P0 | PASS |
| 4.4.4 | Report existing cat sighting | 1. Arrive with catId from IdentifyScreen. 2. Select condition. 3. Submit. | New sighting inserted against existing cat. No new cat row created. | P1 | PASS |
| 4.4.5 | Existing cat — injured updates priority | 1. Report sighting for existing cat as "injured". | Existing cat's priority updated to Urgent. | P1 | PASS |
| 4.4.6 | Photo upload failure (network error) | 1. Simulate bad network during upload. | Cat and sighting still saved. Photo upload error logged; app does not crash. | P1 | PASS |
| 4.4.7 | Discard confirmation | 1. Tap "✕" close button. | Alert shows "Discard report?" with Keep editing / Discard options. | P2 | PASS |

### 4.5 Success Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.5.1 | Success for new cat | 1. Complete report for new cat. | Shows "[Name] is on the map!". Photo displayed. "You're [name]'s first spotter!" shown. | P0 | PASS |
| 4.5.2 | Success for existing cat | 1. Complete sighting report for existing cat. | Shows "Sighting logged for [name]!". Different messaging than new cat. | P1 | PASS |
| 4.5.3 | Urgent cat warning | 1. Report injured cat. | Orange "Marked as injured — volunteers notified" message shown. | P1 | PASS |
| 4.5.4 | Navigate to cat profile | 1. Tap "View full profile". | Opens CatProfileScreen for the just-reported cat. | P1 | PASS |
| 4.5.5 | Navigate back to map | 1. Tap "Back to map". | Returns to MapScreen (tabs). | P1 | PASS |

---

## 5. Cat Profile Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 5.1 | Profile loads with data | 1. Tap a cat from CatsScreen or MapScreen. | Name, location, stats (sightings, contributors, last seen), and sighting timeline display. | P0 | PASS |
| 5.2 | Photo stack shows uploaded photos | 1. Open cat with multiple photos. | Polaroid stack shows up to 3 photos. | P1 | PASS |
| 5.3 | Tap stack cycles photos | 1. Tap the photo stack. | Top card animates away; next photo comes to front. | P2 | PASS |
| 5.4 | Generate AI summary (first time) | 1. Open cat with no summary. 2. Tap summary box. | Loading indicator. After 2-5s, summary text appears in purple box. | P0 | PASS |
| 5.5 | Regenerate AI summary | 1. Open cat with existing summary. 2. Tap refresh "↻" icon. | New summary replaces old one. | P2 | PASS |
| 5.6 | AI summary fails gracefully | 1. Remove GEMINI_API_KEY from secrets. 2. Tap generate. | Alert "Failed to generate AI summary..." shown. App does not crash. | P1 | PASS |
| 5.7 | Follow cat | 1. Tap "Follow" button. | Button switches to "Following" with different style. Row appears in Profile → followed cats. | P1 | PASS |
| 5.8 | Unfollow cat | 1. Tap "Following" button. | Button switches back to "Follow". Cat removed from Profile → followed list. | P1 | PASS |
| 5.9 | Log Sighting button | 1. Tap "Log Sighting". | Report flow opens pre-filled with catId and catName (skips Identify step). | P1 | PASS |
| 5.10 | See on Map button | 1. Tap "See on map". | Map screen centres and opens callout for this cat. | P1 | PASS |
| 5.11 | Cat not found | 1. Navigate to CatProfile with invalid catId. | "Cat not found." message shown. No crash. | P2 | PASS |

---

## 6. Cats List Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 6.1 | List loads all cats | 1. Tap Cats tab. | All cats shown in descending creation order. Each card has photo/emoji, name, status badge, location, last seen. | P0 | PASS |
| 6.2 | Search by name | 1. Type "Mi" in search box. | List filters to show only cats whose name contains "Mi". | P1 | PASS |
| 6.3 | Filter by status | 1. Tap "Neutered" filter tab. | Only neutered cats shown. | P1 | PASS |
| 6.4 | Combined search + filter | 1. Select "Spotted" filter. 2. Type search text. | Both filters apply simultaneously. | P2 | PASS |
| 6.5 | Tap cat card | 1. Tap any cat card. | CatProfileScreen opens for that cat. | P0 | PASS |
| 6.6 | Empty state | 1. All cats removed from DB. | "No cats found." message displayed. | P2 | PASS |

---

## 7. Colony Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 7.1 | Colony stats load | 1. Tap Colony tab. | Colony name, known cats count, need trapping count, and volunteers count display. | P0 | PASS |
| 7.2 | Overall progress bar | 1. Observe "Colony neutered" section. | Progress bar reflects neutered/total ratio. Fraction label matches. | P1 | PASS |
| 7.3 | Zone breakdown | 1. Colony has multiple zones. | Each zone shows its own progress bar with neutered/total. | P1 | PASS |
| 7.4 | No zones defined | 1. Colony has 0 zones. | "No active zones defined yet." empty state card shown. | P2 | PASS |
| 7.5 | Navigate to Trap Queue | 1. Tap "Trap Queue" button. | TrapQueueScreen opens. | P1 | PASS |
| 7.6 | Export PDF report | 1. Tap "Export progress report". 2. Observe loading. | PDF generated. Native share sheet opens with the PDF. | P0 | PASS |
| 7.7 | PDF content accuracy | 1. Open the shared PDF. | Stats (total cats, neutered, trapping needed, reporters, zone breakdown) match the screen values. | P1 | PASS |
| 7.8 | Export while already exporting | 1. Tap export. 2. Immediately tap again. | Button disabled during export. Only one PDF generated. | P2 | PASS |
| 7.9 | User has no colony | 1. Create user with no colony_id. 2. Open Colony tab. | Fallback to first colony in database. Screen still loads. | P2 | PASS |

---

## 8. Trap Queue Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 8.1 | Queue loads unresolved cats | 1. Navigate to Trap Queue. | Only cats with status "spotted" or "trapped" shown. Title shows count. | P0 | PASS |
| 8.2 | Filter by Urgent | 1. Tap "Urgent" filter. | Only cats with Urgent or High priority shown. | P1 | PASS |
| 8.3 | Filter by New | 1. Tap "New" filter. | Only cats created in the last 48 hours shown. | P1 | PASS |
| 8.4 | Filter by Overdue | 1. Tap "Overdue" filter. | Only cats with no sightings or latest sighting older than 5 days shown. | P1 | PASS |
| 8.5 | Claim (self-assign) task | 1. Tap "Claim Task (Assign to me)" on unassigned cat. | Cat shows assignment banner with your name. Button changes to "Update Status" + "Release". | P0 | PASS |
| 8.6 | Release assigned task | 1. Tap "Release" on your assigned cat. | Cat returns to unassigned state. "Claim Task" button reappears. | P1 | PASS |
| 8.7 | Update status — spotted → trapped | 1. Tap "Update Status". 2. Select "Trapped (In transit/clinic)". | Status updates. Alert confirms. | P0 | PASS |
| 8.8 | Update status — mark as returned + neutered | 1. Tap "Update Status". 2. Select "Mark as Returned". 3. Select "Yes, neutered". 4. Select condition. | Cat status → neutered. New sighting with condition logged. Cat disappears from queue on refresh. | P0 | PASS |
| 8.9 | Update status — returned without neuter | 1. Select "Mark as Returned". 2. Select "No, not neutered". 3. Select condition. | Cat status → returned. New sighting logged. Cat disappears from queue. | P1 | PASS |
| 8.10 | View Profile from queue | 1. Tap "View Profile" on any queue card. | CatProfileScreen opens. | P1 | PASS |
| 8.11 | See on Map from queue | 1. Tap "See on Map" on any queue card. | MapScreen centres on that cat's last sighting location. | P1 | PASS |
| 8.12 | Non-volunteer user sees disabled action | 1. Log in as reporter (not volunteer/coordinator). | "Help Needed (Volunteers Only)" shown instead of claim button. | P2 | PASS |
| 8.13 | Other volunteer's task — cannot claim | 1. View cat assigned to another volunteer. | "Assigned to [name]" displayed. No action buttons. | P1 | PASS |
| 8.14 | Coordinator can update any task | 1. Log in as coordinator. 2. View cat assigned to another volunteer. | "Update Status" and "Release" buttons available. | P1 | PASS |
| 8.15 | Empty queue | 1. All cats neutered/returned. | "No cats in the queue matching this filter." empty state. | P2 | PASS |

---

## 9. Profile Screen

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 9.1 | Profile displays user info | 1. Tap Profile tab. | Avatar, display name, role label, email shown. | P0 | PASS |
| 9.2 | Edit profile — change name | 1. Tap "Edit Profile". 2. Change display name. 3. Tap "Save Profile". | Name updates. Success alert shown. | P1 | PASS |
| 9.3 | Edit profile — change avatar | 1. Tap "Edit Profile". 2. Select different avatar. 3. Save. | Avatar updates on profile card. | P1 | PASS |
| 9.4 | Edit profile — change colony | 1. Tap "Edit Profile". 2. Select different colony chip. 3. Save. | Colony association updates. Colony screen reflects new colony. | P1 | PASS |
| 9.5 | Edit profile — empty name rejected | 1. Clear display name field. 2. Tap "Save Profile". | Alert "Display name cannot be empty." | P2 | PASS |
| 9.6 | Followed cats list | 1. Follow 2 cats. 2. Go to Profile tab. | "Cats I Follow (2)" section shows both cats with photos and status badges. | P1 | PASS |
| 9.7 | Tap followed cat | 1. Tap a cat in the followed list. | CatProfileScreen opens for that cat. | P1 | PASS |
| 9.8 | No followed cats | 1. User follows 0 cats. | Empty state card: "No followed cats yet..." with guidance text. | P2 | PASS |
| 9.9 | Logout clears session | 1. Tap "Log Out". 2. Reopen app. | LoginScreen shown. No stale data. | P0 | PASS |

---

## 10. Cross-Cutting / Edge Cases

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 10.1 | Offline launch | 1. Disable network. 2. Open app. | Loading spinner stays. No crash. App works if session cached. | P1 | PASS |
| 10.2 | Network error during report submit | 1. Start report. 2. Disable network at Details step. 3. Tap submit. | Error message displayed. Data not lost. User can retry. | P1 | PASS |
| 10.3 | Deep link from cat profile to map and back | 1. Cat Profile → "See on map" → callout → tap → Cat Profile again. | Full round trip works without navigation stack errors. | P2 | PASS |
| 10.4 | Report flow dismiss at any step | 1. Tap "✕" at Location/Identify/Camera step. | Returns to previous screen (Map tab). No orphan data created. | P1 | PASS |
| 10.5 | Rapid tab switching | 1. Quickly tap between all 4 tabs. | No crash. Data loads correctly on each tab. | P2 | PASS |
| 10.6 | Very long cat name | 1. Enter 200-character name during report. | Name saved and displays with text truncation. No layout break. | P2 | PASS |
| 10.7 | Multiple photos for same cat | 1. Report same cat 3 times with photos. | CatProfileScreen shows photo stack with all 3. | P1 | PASS |
| 10.8 | Concurrent users updating same cat | 1. Two users open TrapQueue. 2. Both tap "Claim" on same cat. | Second user's request succeeds (last write wins) or one gets error. No data corruption. | P2 | PASS |
