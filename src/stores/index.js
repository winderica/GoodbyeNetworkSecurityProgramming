import { action, computed, makeObservable, observable } from 'mobx';

class MessageStore {
    @observable
    messages = {};

    constructor() {
        makeObservable(this);
    }

    @action
    addMessage(ip, message) {
        this.messages[ip] ? this.messages[ip].push(message) : this.messages[ip] = [message];
    }
}

class ConnectionStore {
    @observable
    connections = {};

    constructor() {
        makeObservable(this);
    }

    @action
    addConnection(ip, connection) {
        this.connections[ip] = connection;
    }

    @computed
    get ips() {
        return Object.keys(this.connections);
    }
}

class NotificationStore {
    @observable
    notifications = [];

    constructor() {
        makeObservable(this);
    }

    @action
    enqueueSnackbar = ({ message, options }) => {
        this.notifications.push({
            key: Date.now(),
            message,
            options
        });
    };

    @action
    enqueue = (message, variant) => {
        this.enqueueSnackbar({
            message,
            options: {
                variant,
            },
        });
    };

    @action
    enqueueError = (message) => {
        this.enqueue(message, 'error');
    };

    @action
    enqueueWarning = (message) => {
        this.enqueue(message, 'warning');
    };

    @action
    enqueueInfo = (message) => {
        this.enqueue(message, 'info');
    };

    @action
    enqueueSuccess = (message) => {
        this.enqueue(message, 'success');
    };

    @action
    removeSnackbar = (key) => {
        this.notifications = this.notifications.filter(notification => notification.key !== key);
    };
}

export const stores = {
    messageStore: new MessageStore(),
    connectionStore: new ConnectionStore(),
    notificationStore: new NotificationStore(),
};
