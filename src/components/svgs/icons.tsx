import { createIcon } from './createIcon';

// Material Symbols paths, in a 960-unit viewBox. Each shadow is tuned to its icon's shape.

// Medium, to lift the note off the video.
export const Audio = createIcon(
  'M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z',
  { spread: 110, offsetY: 14, opacity: 0.5 }
);

// Tight, so the thin stroke keeps its shape.
export const Check = createIcon('M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z', {
  spread: 100,
  offsetY: 12,
  opacity: 0.55,
});

// Tight, so the thin stroke keeps its shape.
export const ChevronLeft = createIcon('M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z', {
  spread: 100,
  offsetY: 12,
  opacity: 0.55,
});

// Tight, so the thin strokes keep their shape.
export const Close = createIcon(
  'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
  { spread: 100, offsetY: 12, opacity: 0.55 }
);

// Tight around the thin corner brackets.
export const Maximize = createIcon(
  'M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z',
  { spread: 100, offsetY: 12, opacity: 0.55 }
);

// Tight around the thin corner brackets.
export const Minimize = createIcon(
  'M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z',
  { spread: 100, offsetY: 12, opacity: 0.55 }
);

// Wide and soft like Play, a little tighter around the narrower bars.
export const Pause = createIcon('M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z', {
  spread: 160,
  offsetY: 20,
  opacity: 0.5,
});

// Hugs the edge of the outline, which reaches the edge of the box.
export const PictureInPicture = createIcon(
  'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Zm280-40h320v-240H440v240Zm80-80v-80h160v80H520Z',
  { spread: 80, offsetY: 10, opacity: 0.5 }
);

// Hugs the edge of the outline, which reaches the edge of the box.
export const PictureInPictureExit = createIcon(
  'M160-160q-33 0-56.5-23.5T80-240v-280h80v280h640v-480H440v-80h360q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm523-140 57-57-124-123h104v-80H480v240h80v-103l123 123ZM80-600v-200h280v200H80Zm400 120Z',
  { spread: 70, offsetY: 8, opacity: 0.55 }
);

// Wide and soft: the large center button sits right over the video.
export const Play = createIcon('M320-200v-560l440 280-440 280Z', { spread: 180, offsetY: 24, opacity: 0.5 });

// Hugs the edge, so the solid box doesn't turn into a dark slab.
export const Quality = createIcon(
  'M240-360h60v-80h80v80h60v-240h-60v100h-80v-100h-60v240Zm280 0h160q17 0 28.5-11.5T720-400v-160q0-17-11.5-28.5T680-600H520v240Zm60-60v-120h80v120h-80ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z',
  { spread: 80, offsetY: 10, opacity: 0.45 }
);

// Hugs the edge of the large outline; the gear reaches the bottom of the box.
export const Settings = createIcon(
  'M480-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v200h-80v-200H160v480h320v80ZM380-300v-360l280 180-280 180ZM714-40l-12-60q-12-5-22.5-10.5T658-124l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T702-380l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T806-100l-12 60h-80Zm40-120q33 0 56.5-23.5T834-240q0-33-23.5-56.5T754-320q-33 0-56.5 23.5T674-240q0 33 23.5 56.5T754-160Z',
  { spread: 60, offsetY: 8, opacity: 0.6 }
);

// Soft like Play, a little tighter for the smaller shape.
export const SkipNext = createIcon('M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Z', {
  spread: 140,
  offsetY: 18,
  opacity: 0.5,
});

// Soft like Play, a little tighter for the smaller shape.
export const SkipPrevious = createIcon('M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Z', {
  spread: 140,
  offsetY: 18,
  opacity: 0.5,
});

// Hugs the edge of the dial, which spans the whole box.
export const Speed = createIcon(
  'M418-340q25 25 63 23.5t55-27.5l224-336-336 224q-26 18-28.5 54.5T418-340ZM204-160q-22 0-40.5-9.5T134-198q-26-47-40-97.5T80-400q0-83 31.5-156T197-683q54-54 127-85.5T480-800q82 0 154 31t126 84.5q54 53.5 86 125T879-406q1 55-12.5 107.5T825-198q-11 19-29.5 28.5T755-160H204Z',
  { spread: 80, offsetY: 10, opacity: 0.5 }
);

// Hugs the edge, so the solid box doesn't turn into a dark slab.
export const Subtitles = createIcon(
  'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm80-160h320v-80H240v80Zm400 0h80v-80h-80v80ZM240-480h80v-80h-80v80Zm160 0h320v-80H400v80Z',
  { spread: 80, offsetY: 10, opacity: 0.45 }
);

// Hugs the edge and stays inside the narrow margin the slash leaves.
export const SubtitlesOff = createIcon(
  'M720-560H514L274-800h526q33 0 56.5 23.5T880-720v476q0 11-2 21t-8 19L594-480h126v-80ZM822-26 686-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800v112L26-822l56-56L878-82l-56 56ZM240-480h80v-48l-32-32h-48v80Zm206 80H240v80h286l-80-80Z',
  { spread: 60, offsetY: 8, opacity: 0.6 }
);

// Stays inside the narrow margin the slash leaves.
export const VolumeOff = createIcon(
  'M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Z',
  { spread: 70, offsetY: 8, opacity: 0.6 }
);

// Medium, to lift the sound waves off the video.
export const VolumeUp = createIcon(
  'M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320Z',
  { spread: 110, offsetY: 14, opacity: 0.5 }
);
