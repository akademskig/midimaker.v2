import { useCallback, useContext, useRef } from 'react'
import { uniq, flatMap } from 'lodash'
import { SoundfontProviderContext } from '../providers/SoundfontProvider/SoundfontProvider'
import {
  PlayEvent,
  TChannel,
  PlayChannelEvent
} from '../providers/SoundfontProvider/SoundFontProvider.types'
import { WindowExtended } from '../globals'



interface IAudioNode {
  play: () => unknown,
  stop: () => unknown
}

interface IActiveAudioNodes {
  [string: string]: IAudioNode | null
}

const windowExtended: WindowExtended = window
const audioContext = new (windowExtended && (windowExtended.AudioContext || windowExtended.webkitAudioContext))()

interface IAudioPlayer {
  playNote: (event: PlayEvent) => void;
  stopNote: (midiNumber: number) => void;
  startNote: (midiNumber: number) => void;
  playAll: (channels: TChannel[]) => void
  stopPlayAll: () => void,
  stopAllNotes: () => void
}
function AudioPlayer(): IAudioPlayer {
  const activeAudioNodes = useRef<IActiveAudioNodes>({})
  const scheduledEvents: Array<number> = []
  const { cachedInstruments, currentInstrument } = useContext(SoundfontProviderContext)


  const startNote = useCallback(
    (midiNumber, instrumentName?: string) => {
      return audioContext.resume().then(() => {
        const audioNode = instrumentName
          ? cachedInstruments?.[instrumentName]?.play(midiNumber)
          : currentInstrument?.player?.play(midiNumber)
        if (audioNode) {
          activeAudioNodes.current = {
            ...activeAudioNodes.current,
            [midiNumber]: audioNode,
          }
        }
      })
    },
    [cachedInstruments, currentInstrument]
  )

  const stopNote = useCallback((midiNumber) => {
    const { current: audioNodes } = activeAudioNodes
    return audioContext.resume().then(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      audioNodes && audioNodes[midiNumber] && audioNodes[midiNumber].stop()
      activeAudioNodes.current = { ...audioNodes, [midiNumber]: null }
    })
  }, [])

  const playNote = useCallback((lastEvent: PlayEvent, instrumentName?: string) => {
    console.log(lastEvent)
    startNote(lastEvent.midiNumber, instrumentName)
    setTimeout(() => {
      stopNote(lastEvent.midiNumber)
    }, lastEvent.duration * 1000)
  }, [startNote, stopNote])

  const playAll = useCallback(
    async (channels: Array<TChannel>) => {
      let joinedEvents: PlayChannelEvent[] = []
      if (channels.length > 0) {
        joinedEvents = flatMap(channels.map((channel: TChannel) => {
          return channel.notes.map((note) => {
            return { ...note, ...{ instrumentName: channel.instrumentName } }
          })
        }))
      }
      const startAndEndTimes = uniq(
        flatMap(joinedEvents, (event) => [
          event.time,
          event.time + event.duration,
        ])
      )
      startAndEndTimes.forEach((time, i) => {
        scheduledEvents.push(
          setTimeout(() => {
            const currentEvents = joinedEvents.filter((event: PlayEvent) => {
              return event.time <= time && event.time + event.duration > time
            })
            currentEvents.forEach((currentEvent: PlayChannelEvent) => {
              playNote(currentEvent, currentEvent.instrumentName)
            })
          }, time * 1000)
        )
      })
    },
    [playNote, scheduledEvents]
  )

  // Clear any residual notes that don't get called with stopNote
  const stopAllNotes = useCallback(() => {
    audioContext.resume().then(() => {
      const activeAudioNodesValues = Object.values(
        activeAudioNodes.current || {}
      )
      activeAudioNodesValues.forEach((node) => {
        if (node) {
          node.stop()
        }
      })
      activeAudioNodes.current = {}
    })
  }, [activeAudioNodes])

  const stopPlayAll = useCallback(() => {
    scheduledEvents.forEach((scheduledEventId) => {
      clearTimeout(scheduledEventId)
    })
    stopAllNotes()
  }, [scheduledEvents, stopAllNotes])

  // channelsToPlaylist = async (channels) => {
  //   channels.forEach(async c => {
  //     this.instruments[c.instrumentName] = await this.loadChannelInstrument(c.instrumentName)
  //   })
  // }

  return {
    playAll,
    stopPlayAll,
    playNote,
    stopNote,
    stopAllNotes,
    startNote,
  }
}

function useAudioPlayer(): IAudioPlayer {
  return AudioPlayer()
}

export default AudioPlayer
export { useAudioPlayer }
