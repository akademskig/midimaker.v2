import React, { useContext } from 'react'
import {SoundfontProviderContext} from '../providers/SoundfontProvider'
import NotesGridRenderer from './NotesGrid/NotesGridRenderer'
import { MidiNumbers } from 'react-piano'
import { Note } from '../types/SoundFontProvider.types'
const NotesGrid = () => {
    const ctx = useContext(SoundfontProviderContext)
    // const { currentInstrument } = ctx 
    const midiNumbersToNotes = MidiNumbers.NATURAL_MIDI_NUMBERS.reduce((obj: any, midiNumber: number) => {
        obj[midiNumber] = MidiNumbers.getAttributes(midiNumber).note
        return obj
    }, {})
   const noteRange = {
        first: 43,
        last: 67,
    }
    const notes = []
    for (let i = noteRange.first; i <= noteRange.last; i++)
    notes.push(MidiNumbers.getAttributes(i))
    notes.reverse()
    console.log(notes)
    const mockProps = {
        channels: [],
        channelColor: '#f2046d',
        currentChannel: null,
        loading: false,
        controller: {
            playing: false,
            recording: false,
            resetRecording: true
        },
        setController: () => {},
        canvasContainer: {},
        notes: notes,
        midiOffset: 43,
        noteDuration: 0.1,
        recording: {
            events: [],
            currentTime: 0
        },
        absTime: 0,
        recordingGrid: {
            currentTime: 0,
            events: []
        },
        setRecordingGrid: () => {}
    }
    return(
        <div>
        <NotesGridRenderer
        {...mockProps}
        />
        </div>
    )
}

export default NotesGrid