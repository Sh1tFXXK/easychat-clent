import { createStore } from "vuex";
import home from './home';
import socket from './modules/socket';
import navigation from './modules/navigation';

export default createStore({
    modules: {
        home,
        socket,
        navigation
    }
})