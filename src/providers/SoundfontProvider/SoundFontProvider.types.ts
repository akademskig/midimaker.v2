import { Player } from 'soundfont-player'

export enum SoundfontType {
  MusingKyte = 'MusingKyte',
  FluidR3_GM = 'FluidR3_GM',
}
export enum SoundfontFormat {
  mp3 = 'mp3',
  ogg = 'ogg',
}

export interface ICachedInstruments {
  [string: string]: Player;
}

export type SoundfontProviderContextValue = {
  currentInstrument: TCurrentInstrument | null;
  loadInstrument: (instrumentName: string) => Promise<unknown>;
  loading: boolean;
  cachedInstruments: ICachedInstruments;
};

export type TCurrentInstrument = {
  name: string,
  player: Player | null
}

export type TChannel = {
  instrumentName: string;
  notes: Array<PlayEvent>;
  color?: string;
  duration: number;
};

export type Note = {
  isAccidental: boolean;
  midiNumber: number;
  note: string;
  octave: number;
  pitchName: string;
  duration: number;
  time: number;
};

export interface PlayEvent  {
  time: number;
  duration: number;
  midiNumber: number;
}

export interface PlayChannelEvent extends PlayEvent {
  instrumentName: string
}
export interface ChannelRenderEvent extends PlayEvent{
  color?: string
}
