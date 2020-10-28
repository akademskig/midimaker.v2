import { useState } from 'react'


interface IControllerState {
    PLAYING: boolean
    RECORDING:boolean,
    RECORDING_RESET: boolean
}

interface IAudioController {
    controllerState: IControllerState,
    setControllerState: React.Dispatch<React.SetStateAction<IControllerState>>,
}

const initialControllerState = {
    PLAYING: false,
    RECORDING: false,
    RECORDING_RESET: false
}
function AudioController(): IAudioController {
    const [controllerState, setControllerState] = useState<IControllerState>(initialControllerState)

    return ({
        controllerState,
        setControllerState,
    })
}

function useAudioController(): IAudioController {
    return AudioController()
}

export default AudioController
export {
    useAudioController
}
