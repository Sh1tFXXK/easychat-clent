import { createStore } from "vuex";
import chat from './modules/chat'
import groups from './modules/groups'
import socket from './modules/socket'
import home from './home'

export default createStore({
    modules: {
        chat,
        groups,
        socket,
        home
    }
})
