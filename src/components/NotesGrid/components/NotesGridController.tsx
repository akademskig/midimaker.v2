import { MouseEvent, useCallback } from 'react'
import useAudioPlayer from '../../controllers/AudioPlayer'
import { isEqual } from 'lodash'
import { useNotesGridRenderer } from './NotesGridRenderer'
import { useAudioStateProvider } from '../../../providers/AudioStateProvider/AudioStateProvider'
import { TChannel } from '../../../providers/SoundfontProvider/SoundFontProvider.types'
import { TRecordingGrid, TSetRecordingGrid } from '../../../providers/AudioStateProvider/AudioStateProvider.types'

export interface INotesGridControllerProps {
  canvasTimeUnit: number,
  currentChannel: TChannel | null,
  setRecordingGrid: TSetRecordingGrid
  offsetFirst: number,
  recordingGrid: TRecordingGrid
}

export interface INotesGridController {
  toggleNote: (event: MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>) => void
}

function NotesGridController(): INotesGridController {
  const { playNote } = useAudioPlayer()
  const { canvasTimeUnit, findNoteByGridCoordinates } = useNotesGridRenderer()
  const { setGridRecording, gridRecording, currentChannel } = useAudioStateProvider()

  const toggleNote = useCallback(
    (event) => {
      const note = findNoteByGridCoordinates(event)
      console.log(note)
      if(!note){
        return
      }
      if (
        !currentChannel ||
        currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, note.midiNumber) &&
            e.time === note.time
        ) === -1
      ) {
        playNote(note)
        console.log(currentChannel, 'currentchannel')
        setGridRecording({
          events: [ ...(currentChannel?.notes|| []), note],
          currentTime:
            note.time + note.duration > gridRecording.currentTime
              ? note.time + note.duration
              : gridRecording.currentTime,
        })
      } else {
        const duplicate = currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, note.midiNumber) &&
            e.time === note.time
        )
        if (duplicate !== -1 && currentChannel.notes.length > 0) {
          let lastTime = 0
          currentChannel.notes.splice(duplicate, 1)
          currentChannel.notes.forEach((e) => {
            if (lastTime < e.time) lastTime = e.time
          })
          setGridRecording({
            events: currentChannel.notes,
            currentTime:
              note.time + note.duration >= gridRecording.currentTime
                ? lastTime + 1 / canvasTimeUnit
                : gridRecording.currentTime,
          })
        }
      }
    },
    [findNoteByGridCoordinates, currentChannel, playNote, setGridRecording, gridRecording.currentTime, canvasTimeUnit]
  )
  return {
    toggleNote
  }
}

export default NotesGridController

export function useNotesGridController(): INotesGridController {
  return NotesGridController()
}