#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "VideoToolkit.h"

#import <React/RCTUtils.h>

@implementation VideoToolkit {
  BOOL _isFullscreen;
}

RCT_EXPORT_MODULE()

// iOS has no navigation bar to hide, so "fullscreen" here mirrors Android's
// immersive mode by hiding the status bar. Orientation is handled on the JS
// side, so this module only owns the system chrome and the fullscreen flag.
- (void)setFullscreen:(BOOL)fullscreen resolve:(RCTPromiseResolveBlock)resolve {
  dispatch_async(dispatch_get_main_queue(), ^{
#if !TARGET_OS_TV
    UIApplication *application = RCTSharedApplication();
    if (application == nil) {
      resolve(@(NO));
      return;
    }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [application setStatusBarHidden:fullscreen
                      withAnimation:UIStatusBarAnimationSlide];
#pragma clang diagnostic pop
#endif
    self->_isFullscreen = fullscreen;
    resolve(@(YES));
  });
}

- (void)enterFullscreen:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
  [self setFullscreen:YES resolve:resolve];
}

- (void)exitFullscreen:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  [self setFullscreen:NO resolve:resolve];
}

- (void)isFullscreen:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  resolve(@(self->_isFullscreen));
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeVideoToolkitSpecJSI>(params);
}

@end
