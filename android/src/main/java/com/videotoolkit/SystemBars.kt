package com.videotoolkit

import android.app.Activity
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import androidx.annotation.RequiresApi
import androidx.annotation.UiThread

/** Hides and shows an activity's status and navigation bars, for fullscreen. */
internal object SystemBars {
  /**
   * Hides the bars. A swipe brings them back: for a moment on a phone, until hidden again on a TV.
   * @return Whether the window took the change.
   */
  @UiThread
  fun hide(activity: Activity, isTV: Boolean): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val controller = activity.window.insetsController ?: return false
      controller.hide(bars())
      controller.systemBarsBehavior = if (isTV) swipeBehavior() else WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      return true
    }
    @Suppress("DEPRECATION")
    activity.window.decorView.systemUiVisibility = legacyHiddenFlags(isTV)
    return true
  }

  /**
   * Shows the bars again.
   * @return Whether the window took the change.
   */
  @UiThread
  fun show(activity: Activity): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val controller = activity.window.insetsController ?: return false
      controller.show(bars())
      controller.systemBarsBehavior = swipeBehavior()
      return true
    }
    @Suppress("DEPRECATION")
    activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
    return true
  }

  /**
   * Whether the bars are hidden, from the window's flags. `null` from Android 11, where the window
   * can't say whether a swipe has brought them back for a moment.
   */
  @UiThread
  fun areHidden(activity: Activity): Boolean? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) return null
    @Suppress("DEPRECATION")
    return activity.window.decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_FULLSCREEN != 0
  }

  // Before Android 11, the window's flags are the only way
  @Suppress("DEPRECATION")
  private fun legacyHiddenFlags(isTV: Boolean): Int =
    if (isTV) {
      View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE
    } else {
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
    }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun bars(): Int = WindowInsets.Type.navigationBars() or WindowInsets.Type.statusBars()

  // Android 12's BEHAVIOR_DEFAULT, which has the same value
  @Suppress("DEPRECATION")
  @RequiresApi(Build.VERSION_CODES.R)
  private fun swipeBehavior(): Int = WindowInsetsController.BEHAVIOR_SHOW_BARS_BY_SWIPE
}
