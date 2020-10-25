import { useContext } from 'react'
import {SoundfontProviderContext} from '../providers/SoundfontProvider'
import NotesGridRenderer from './NotesGrid/NotesGridRenderer'
import { MidiNumbers } from 'react-piano'
import { Note } from '../types/SoundFontProvider.types'
import { TRecordingGrid } from './NotesGrid/NotesGrid.types'

function AudioController(props){

    const channels = []
    const noteRange = {
        first: 43,
        last: 67,
    }
    const notes = []
    for (let i = noteRange.first; i <= noteRange.last; i++)
    notes.push(MidiNumbers.getAttributes(i))
    notes.reverse()
    const channel = {
        instrumentName: 'acoustic_grand_piano',
        notes: [],
        color: 'yellow',
        duration: 0
    }
    const mockProps = {
        channels: [channel],
        channelColor: '#f2046d',
        currentChannel: channel,
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
        setRecordingGrid: (recording: TRecordingGrid) => {
          console.log(recording)
        }
    }

    return ({

    })
}

export default AudioController