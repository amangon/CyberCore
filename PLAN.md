# Audit Fix Plan

## Part 1 - Profile Photo Upload
**Root cause:** `settings.service.ts` uses mock data, not real API. `AvatarUploader.tsx` is a placeholder with no file selection/upload logic. Backend `authController.js` has no avatar upload route.

**Fix:**
1. Add `upload.single('avatar')` multer middleware + `/avatar` route to `auth.js` routes
2. Add `updateAvatar` controller to `authController.js` (saves to Cloudinary, updates MongoDB)
3. Rewrite `settings.service.ts` to call real backend API endpoints
4. Rewrite `AvatarUploader.tsx` with file picker, preview, upload, progress, error handling
5. Fix `ProfileSettingsPage.tsx` to use real API calls

## Part 2 - Reusable ResultCard Component
**Root cause:** Each scanner has its own duplicated display logic with inconsistent field mapping

**Fix:**
1. Create `src/components/scan/ResultCard.tsx` - premium reusable component
2. Update all scanners to use it

## Part 3 - Data Mapping
Already fixed in prior session (scan.service.ts mapScanResult)

## Part 4 - Buttons
Add loading states, disable during loading, success/error feedback

## Part 5 - Responsive UI
Handled by the ResultCard component design
