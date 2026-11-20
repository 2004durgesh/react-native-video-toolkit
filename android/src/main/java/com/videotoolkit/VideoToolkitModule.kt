package com.videotoolkit

import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class VideoToolkitModule(reactContext: ReactApplicationContext) :
  NativeVideoToolkitSpec(reactContext) {

  // Only read and written on the UI thread, where the bars change
  private var barsHidden = false

  companion object {
    const val NAME = "VideoToolkit"
  }

  override fun getName(): String = NAME

  @ReactMethod
  override fun enterFullscreen(promise: Promise) {
    setBarsHidden(true, promise)
  }

  @ReactMethod
  override fun exitFullscreen(promise: Promise) {
    setBarsHidden(false, promise)
  }

  @ReactMethod
  override fun isFullscreen(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    UiThreadUtil.runOnUiThread {
      promise.resolve(SystemBars.areHidden(activity) ?: barsHidden)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  override fun isPictureInPictureSupported(): Boolean = PictureInPictureSupport.check(reactApplicationContext)

  /**
   * Hides or shows the system bars, and resolves `promise` once with whether it worked. The promise is
   * a success flag the toolkit doesn't wait for, so no activity resolves `false` rather than rejecting.
   */
  private fun setBarsHidden(hidden: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    val isTV = isAndroidTV()
    UiThreadUtil.runOnUiThread {
      val changed = try {
        if (hidden) SystemBars.hide(activity, isTV) else SystemBars.show(activity)
      } catch (e: Exception) {
        Log.e(NAME, "Couldn't change the system bars", e)
        false
      }
      if (changed) barsHidden = hidden
      promise.resolve(changed)
    }
  }

  private fun isAndroidTV(): Boolean {
    val uiModeManager = reactApplicationContext.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
    return uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
  }
}
