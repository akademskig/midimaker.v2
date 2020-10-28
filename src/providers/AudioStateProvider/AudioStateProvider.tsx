import React, { useMemo, useRef, useState } from 'react'
import { MidiNumbers } from 'react-piano'
import { range } from 'lodash'
import { Note, TChannel } from '../SoundfontProvider/SoundFontProvider.types'
import { TRecordingGrid } from './AudioStateProvider.types'

const initialNoteRange = {
    first: 43,
    last: 67,
}
const initialNoteDuration = 0.1
const initialChannelColor = '#ff6600'
const initailGridRecording: TRecordingGrid = {
    events: [],
    currentTime: 0
}

interface IAudioStateProvider {
    setGridRecording: React.Dispatch<React.SetStateAction<TRecordingGrid>>
    gridRecording: TRecordingGrid
    currentChannel: TChannel | null;
    setCurrentChannel: React.Dispatch<React.SetStateAction<TChannel | null>>
    setChannelColor: React.Dispatch<React.SetStateAction<string>>
    channels: TChannel[];
    notes: Note[];
    noteDuration: number,
    channelColor: string,
}
const initialChannel = {
    instrumentName: 'acoustic_grand_piano',
    notes: [],
    color: 'yellow',
    duration: 0
}
const AudioStateProvider = (): IAudioStateProvider => {
    // const { currentInstrument } = ctx 

    const [noteRange, setNoteRange] = useState(initialNoteRange)
    const [noteDuration, setNoteDuration] = useState(initialNoteDuration)
    const [channelColor, setChannelColor] = useState(initialChannelColor)
    const [gridRecording, setGridRecording] = useState(initailGridRecording)
    console.log(gridRecording)
    const [currentChannel, setCurrentChannel] = useState<TChannel | null>(initialChannel)


    const channels = useRef<TChannel[]>([])

    const notes = useMemo(() =>
        range(noteRange.first, noteRange.last)
            .map((idx: number) => MidiNumbers.getAttributes(idx))
            .reverse(), [noteRange.first, noteRange.last])

    // const mockProps = {
    //     channels: [channel],
    //     channelColor: '#f2046d',
    //     currentChannel: channel,
    //     loading: false,
    //     controller: {
    //         playing: false,
    //         recording: false,
    //         resetRecording: true
    //     },
    //     setController: () => {},
    //     canvasContainer: {},
    //     notes: notes,
    //     midiOffset: 43,
    //     noteDuration: 0.1,
    //     recording: {
    //         events: [],
    //         currentTime: 0
    //     },
    //     absTime: 0,
    //     recordingGrid: {
    //         currentTime: 0,
    //         events: []
    //     },
    //     setRecordingGrid: (recording: TRecordingGrid) => {
    //       console.log(recording)
    //     }
    // }
    return ({
        setGridRecording,
        currentChannel,
        setCurrentChannel,
        channelColor,
        setChannelColor,
        noteDuration,
        gridRecording,
        channels: channels.current,
        notes
    })
}

export default AudioStateProvider

export function useAudioStateProvider(): IAudioStateProvider {
    return AudioStateProvider()
}