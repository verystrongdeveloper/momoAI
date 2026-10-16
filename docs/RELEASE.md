# Release checklist

GitHub Releases publish only the Windows program and `MomoStory.apk`.

## Android signing

Create a private signing key once and keep an offline backup. Do not commit the keystore or its passwords.

```powershell
keytool -genkeypair -v -keystore android/release.keystore -alias momostory -keyalg RSA -keysize 4096 -validity 10000
```

Create these GitHub Actions repository secrets from that key:

- `ANDROID_KEYSTORE_BASE64`: Base64 of `android/release.keystore`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

On PowerShell, create the first secret value without line breaks:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('android/release.keystore'))
```

The release workflow fails instead of publishing a debug-signed APK if any signing secret is missing.

## Windows signing

The Windows EXE and installer need an Authenticode certificate or Microsoft Trusted Signing profile for public distribution. Configure that signing identity in GitHub Actions before publishing broadly; an unsigned build can trigger SmartScreen warnings or be blocked on protected devices.

## Publish

After successful APK and Windows smoke tests, push a version tag such as `v1.0.1`. The workflow creates the GitHub Release from the Windows and Android artifacts only.
