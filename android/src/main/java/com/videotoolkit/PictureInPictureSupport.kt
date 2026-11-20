package com.videotoolkit

import android.app.AppOpsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Whether picture-in-picture can work: the system feature, `android:supportsPictureInPicture` on
 * the activity, and the user not having turned it off for the app.
 */
internal object PictureInPictureSupport {
  // ActivityInfo.FLAG_SUPPORTS_PICTURE_IN_PICTURE, which the SDK hides
  private const val FLAG_SUPPORTS_PICTURE_IN_PICTURE = 0x400000

  fun check(context: ReactApplicationContext): Boolean {
    val packageManager = context.packageManager
    if (!packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) return false
    if (!activitySupportsIt(context, packageManager)) return false

    // Android 8+ lets the user turn picture-in-picture off per app
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    // Each name is deprecated in a later Android than the one that added it
    @Suppress("DEPRECATION")
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_PICTURE_IN_PICTURE, Process.myUid(), context.packageName)
    } else {
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_PICTURE_IN_PICTURE, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun activitySupportsIt(context: ReactApplicationContext, packageManager: PackageManager): Boolean {
    try {
      val activity = context.currentActivity
      if (activity != null) {
        return packageManager.getActivityInfo(activity.componentName, 0).flags and FLAG_SUPPORTS_PICTURE_IN_PICTURE != 0
      }
      // No activity yet (early in startup): accept any activity of the app that supports it
      @Suppress("DEPRECATION")
      val activities = packageManager.getPackageInfo(context.packageName, PackageManager.GET_ACTIVITIES).activities
      return activities?.any { it.flags and FLAG_SUPPORTS_PICTURE_IN_PICTURE != 0 } ?: false
    } catch (e: PackageManager.NameNotFoundException) {
      return false
    }
  }
}
