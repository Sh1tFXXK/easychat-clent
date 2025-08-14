import { createStore } from "vuex";
import home from './home';
import socket from './modules/socket';

export default createStore({
    modules: {
        home,
        socket
    }
})