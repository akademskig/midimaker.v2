import { PlayEvent } from '../../types/SoundFontProvider.types'

export interface ICoordinates {
    midiNumber: number;
    x: number;
    y: number;
}

export type TSetRecordingGrid = (gridInput: TRecordingGrid) => void;
export type TRecordingGrid = {
    events: PlayEvent[];
    currentTime: number;
}
