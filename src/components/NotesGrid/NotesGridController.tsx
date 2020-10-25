import { MouseEvent, MutableRefObject, RefObject, useCallback } from 'react'
import useAudioPlayer from '../controllers/AudioPlayer'
import { isEqual } from 'lodash'
import { RECT_WIDTH } from './constants'
import { ICoordinates, TSetRecordingGrid, TRecordingGrid } from './NotesGrid.types'
import { Channel } from '../../types/SoundFontProvider.types'

export interface INotesGridControllerProps {
  canvasBoxRef: RefObject<HTMLDivElement>,
  coordinatesMapRef: MutableRefObject<Array<ICoordinates>>,
  rectangleHeight: number,
  canvasTimeUnit: number,
  currentChannel: Channel | null,
  setRecordingGrid: TSetRecordingGrid
  offsetFirst: number,
  recordingGrid: TRecordingGrid
}

export interface INotesGridController {
  toggleNote: (event: MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>) => void
}

function NotesGridController({
  canvasBoxRef, coordinatesMapRef, rectangleHeight,
  canvasTimeUnit, currentChannel, setRecordingGrid, offsetFirst,
  recordingGrid
}: INotesGridControllerProps): INotesGridController {
  const { playNote } = useAudioPlayer()
  const toggleNote = useCallback(
    (event) => {
      const canvasBoxElement = canvasBoxRef.current
      const coordinatesMap = coordinatesMapRef.current
      if (!canvasBoxElement || !coordinatesMap) {
        return
      }
      const x = event.clientX + canvasBoxElement.scrollLeft
      const y =
        event.clientY - (canvasBoxElement.getBoundingClientRect().top)
      const rect = coordinatesMap.find(
        (i) =>
          x >= i.x &&
          x <= i.x + RECT_WIDTH &&
          y >= i.y &&
          y <= i.y + rectangleHeight
      )
      if (!rect) return
      if (rect.x >= canvasBoxElement.getBoundingClientRect().top) {
        canvasBoxElement.scroll(rect.x + 100, rect.y)
      }

      const lastEvent = {
        midiNumber: rect.midiNumber,
        time: (rect.x - RECT_WIDTH - offsetFirst) / RECT_WIDTH / canvasTimeUnit,
        duration: 1 / canvasTimeUnit,
      }
      if (
        !currentChannel ||
        currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, lastEvent.midiNumber) &&
            e.time === lastEvent.time
        ) === -1
      ) {
        playNote(lastEvent)
        setRecordingGrid({
          events: currentChannel
            ? currentChannel.notes.concat(lastEvent)
            : [lastEvent],
          currentTime:
            lastEvent.time + lastEvent.duration > recordingGrid.currentTime
              ? lastEvent.time + lastEvent.duration
              : recordingGrid.currentTime,
        })
      } else {
        const duplicate = currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, lastEvent.midiNumber) &&
            e.time === lastEvent.time
        )
        if (duplicate !== -1 && currentChannel.notes.length > 0) {
          let lastTime = 0
          currentChannel.notes.splice(duplicate, 1)
          currentChannel.notes.forEach((e) => {
            if (lastTime < e.time) lastTime = e.time
          })
          setRecordingGrid({
            events: currentChannel.notes,
            currentTime:
              lastEvent.time + lastEvent.duration >= recordingGrid.currentTime
                ? lastTime + 1 / canvasTimeUnit
                : recordingGrid.currentTime,
          })
        }
      }
    },
    [canvasBoxRef, canvasTimeUnit, coordinatesMapRef, currentChannel, offsetFirst, playNote, recordingGrid.currentTime, rectangleHeight, setRecordingGrid]
  )
  return {
    toggleNote
  }
}

export default NotesGridController

export function useNotesGridController(props: INotesGridControllerProps): INotesGridController {
  return NotesGridController(props)
}