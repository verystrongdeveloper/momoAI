package com.momostory.app

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.util.concurrent.Executors

/** Save our temporary MP4 into system Downloads, never exposing arbitrary app files. */
class VideoDownloadsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val executor = Executors.newSingleThreadExecutor()
  private var pending: Pair<File, Promise>? = null
  private val requestCode = 6814

  init {
    context.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, request: Int, result: Int, data: Intent?) {
        if (request != requestCode) return
        val task = pending ?: return
        pending = null
        val uri = data?.data
        if (result != Activity.RESULT_OK || uri == null) {
          task.second.reject("EXPORT_CANCELED", "EXPORT_CANCELED")
          return
        }
        executor.execute { copy(task.first, uri, task.second, false) }
      }
    })
  }

  override fun getName() = "MomoVideoDownloads"

  @ReactMethod
  fun save(fileUri: String, filename: String, promise: Promise) {
    try {
      val source = File(Uri.parse(fileUri).path ?: throw IllegalArgumentException("Missing file"))
      require(source.canonicalPath.startsWith(context.cacheDir.canonicalPath + File.separator) && source.isFile)
      require(filename.endsWith(".mp4") && filename == File(filename).name && !filename.contains('\\'))
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        executor.execute {
          var uri: Uri? = null
          try {
            val values = ContentValues().apply {
              put(MediaStore.Downloads.DISPLAY_NAME, filename)
              put(MediaStore.Downloads.MIME_TYPE, "video/mp4")
              put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MomoStory")
              put(MediaStore.Downloads.IS_PENDING, 1)
            }
            uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
              ?: throw IllegalStateException("Could not create download")
            copy(source, uri, promise, true)
          } catch (error: Exception) {
            uri?.let { runCatching { context.contentResolver.delete(it, null, null) } }
            promise.reject("VIDEO_SAVE_FAILED", error)
          }
        }
      } else {
        val activity = context.currentActivity ?: throw IllegalStateException("No activity")
        if (pending != null) throw IllegalStateException("Save already pending")
        pending = Pair(source, promise)
        activity.runOnUiThread {
          try {
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
              addCategory(Intent.CATEGORY_OPENABLE)
              type = "video/mp4"
              putExtra(Intent.EXTRA_TITLE, filename)
            }
            activity.startActivityForResult(intent, requestCode)
          } catch (error: Exception) { pending = null; promise.reject("VIDEO_SAVE_FAILED", error) }
        }
      }
    } catch (error: Exception) { promise.reject("VIDEO_SAVE_FAILED", error) }
  }

  private fun copy(source: File, uri: Uri, promise: Promise, publish: Boolean) {
    try {
      val stream = context.contentResolver.openOutputStream(uri, "w") ?: throw IllegalStateException("Could not open download")
      stream.use { output -> source.inputStream().use { input -> input.copyTo(output) } }
      if (publish && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        context.contentResolver.update(uri, ContentValues().apply { put(MediaStore.Downloads.IS_PENDING, 0) }, null, null)
      }
      promise.resolve(uri.toString())
    } catch (error: Exception) {
      if (publish) runCatching { context.contentResolver.delete(uri, null, null) }
      promise.reject("VIDEO_SAVE_FAILED", error)
    }
  }
}
