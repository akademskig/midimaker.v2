export interface WindowExtended extends Window {
  AudioContext?: AudioContext | any;
  webkitAudioContext?: AudioContext | any;
}
export const windowE: WindowExtended = window
export const audioContext = new (windowE &&
  (windowE.AudioContext || windowE.webkitAudioContext))()
