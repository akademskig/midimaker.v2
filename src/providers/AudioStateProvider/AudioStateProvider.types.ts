import { PlayEvent } from '../SoundfontProvider/SoundFontProvider.types'


export type TSetRecordingGrid = (gridInput: TRecordingGrid) => void;
export type TRecordingGrid = {
    events: PlayEvent [];
    currentTime: number;
}

export type TNoteRange = {
    first: number,
    last: number
}