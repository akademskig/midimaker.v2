import React, { useCallback, useContext, useRef } from 'react'
import { uniq, flatMap } from 'lodash'
import { SoundfontProviderContext } from '../../providers/SoundfontProvider'
import {
  PlayEvent,
  SoundfontProviderContextValue,
  Channel,
  PlayChannelEvent
} from '../../types/SoundFontProvider.types'



interface IAudioNode {
  play: () => unknown,
  stop: () => unknown
}
s
interface IActiveAudioNodes {
  [string: string]: IAudioNode | null
}

const windowE: WindowExtended = window
const audioContext = new (windowE && (windowE.AudioContext || windowE.webkitAudioContext))()

interface IAudioPlayer {
  playNote: (event: PlayEvent) => void;
  stopNote: (midiNumber: number) => void;
  startNote: (midiNumber: number) => void;
  playAll: (channels: Channel[]) => void
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
          : currentInstrument?.play(midiNumber)
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
      //@ts-ignore
      audioNodes && audioNodes[midiNumber] && audioNodes[midiNumber].stop()
      activeAudioNodes.current = { ...audioNodes, [midiNumber]: null }
    })
  }, [])

  // const playNote = useCallback(
  //   (midiNumber, duration, instrumentName) => {
  //     startNote(midiNumber, instrumentName)
  //     window.setTimeout(() => {
  //       stopNote(midiNumber)
  //     }, duration * 1000)
  //   },
  //   [startNote, stopNote]
  // )
  const playNote = useCallback((lastEvent: PlayEvent, instrumentName?: string) => {
    startNote(lastEvent.midiNumber, instrumentName)
    setTimeout(() => {
      stopNote(lastEvent.midiNumber)
    }, lastEvent.duration * 1000)
  }, [startNote, stopNote])

  const playAll = useCallback(
    async (channels: Array<Channel>) => {
      let joinedEvents: any = []
      if (channels.length > 0) {
        joinedEvents = channels.map((channel: Channel) => {
          return channel.notes.map((note) => {
            return { ...note, ...{ instrumentName: channel.instrumentName } }
          })
        })
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
