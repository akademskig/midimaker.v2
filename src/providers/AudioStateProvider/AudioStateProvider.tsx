import React, { Children, createContext, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MidiNumbers } from 'react-piano'
import { range } from 'lodash'
import { Note, TChannel } from '../SoundfontProvider/SoundFontProvider.types'
import { TNoteRange, TRecordingGrid } from './AudioStateProvider.types'

const initialNoteRange = {
    first: 43,
    last: 67,
}
const initialNoteDuration = 0.1
const initialChannelColor = '#ff6600'
const initailGridNotes: TRecordingGrid = {
    events: [],
    currentTime: 0
}
interface IControllerState {
    PLAYING: boolean
    RECORDING:boolean,
    RECORDING_RESET: boolean
}

interface IAudioStateProviderContext {
    currentChannel: TChannel | null;
    setCurrentChannel: React.Dispatch<React.SetStateAction<TChannel | null>>
    setChannelColor: React.Dispatch<React.SetStateAction<string>>
    channels: TChannel[];
    setChannels: React.Dispatch<React.SetStateAction<TChannel[]>>
    notes: Note[];
    noteDuration: number,
    channelColor: string,
    controllerState: IControllerState,
    setControllerState: React.Dispatch<React.SetStateAction<IControllerState>>
    gridNotes: TRecordingGrid,
    setGridNotes: React.Dispatch<React.SetStateAction<TRecordingGrid>>
}

interface IAudioStateProviderProps { 
    children: ReactElement | ReactElement[]
}
const initialChannel = {
    instrumentName: 'acoustic_grand_piano',
    notes: [],
    color: initialChannelColor,
    duration: 0
}
const initialControllerState = {
    PLAYING: false,
    RECORDING: false,
    RECORDING_RESET: false
}

const initialCtxValue = {
        currentChannel: null,
        setCurrentChannel: ((value: React.SetStateAction<TChannel | null>) => (value: TChannel) => value),
        channelColor: '#ff6600',
        setChannelColor: ((value: React.SetStateAction<string>) => (value: string) => value),
        noteDuration: 0.2,
        channels: [],
        setChannels: ((value: React.SetStateAction<TChannel[] | []>) => (value: TChannel[]) => value),
        notes: [],
        controllerState: initialControllerState,
        setControllerState: ((value: React.SetStateAction<IControllerState>) => (value: IControllerState) => value),
        gridNotes: initailGridNotes,
        setGridNotes: ((value: React.SetStateAction<TRecordingGrid>) => (value: TRecordingGrid) => value),
}


export const AudioStateProviderContext = createContext<IAudioStateProviderContext>(initialCtxValue)
const AudioStateProvider = ({ children }: IAudioStateProviderProps): JSX.Element => {
    // const { currentInstrument } = ctx 

    const [noteRange, setNoteRange] = useState<TNoteRange>(initialNoteRange)
    const [noteDuration, setNoteDuration] = useState<number>(initialNoteDuration)
    const [channelColor, setChannelColor] = useState<string>(initialChannelColor)
    const [gridRecording, setGridRecording] = useState<TRecordingGrid>(initailGridNotes)
    const [currentChannel, setCurrentChannel] = useState<TChannel | null>(initialChannel)
    const [controllerState, setControllerState] = useState<IControllerState>(initialControllerState)

    const [channels, setChannels] = useState<TChannel[]>([])
    const [gridNotes, setGridNotes] = useState(initailGridNotes)
    console.log(channels, 'channels')

    const notes = useMemo(() =>
        range(noteRange.first, noteRange.last)
            .map((idx: number) => MidiNumbers.getAttributes(idx))
            .reverse(), [noteRange.first, noteRange.last])

    const ctxValue = useMemo(() => ({
        currentChannel,
        setCurrentChannel,
        channelColor,
        setChannelColor,
        noteDuration,
        channels,
        setChannels,
        notes,
        controllerState,
        setControllerState,
        gridNotes,
        setGridNotes
    }), [channelColor, channels, controllerState, currentChannel, gridNotes, noteDuration, notes])

    return (
        <AudioStateProviderContext.Provider value={ctxValue}>
            { children }
        </AudioStateProviderContext.Provider>
    )
}

export default AudioStateProvider
