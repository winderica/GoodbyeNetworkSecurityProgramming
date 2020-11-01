import { action, computed, makeObservable, observable, toJS } from 'mobx';
import * as idb from 'idb-keyval';
import { AES } from '../utils/aes';

class CertsStore {
    @observable
    key
    @observable
    ca
    @observable
    cert

    constructor() {
        makeObservable(this);
    }

    @action
    async load() {
        this.cert = await idb.get('cert');
        this.ca = await idb.get('ca');
        this.key = await idb.get('key');
    }

    @action
    async set(ca, cert, key) {
        this.cert = cert;
        this.ca = ca;
        this.key = key;
        await idb.set('ca', ca);
        await idb.set('cert', cert);
        await idb.set('key', key);
    }
}

class MessageStore {
    @observable
    messages = {};

    @observable
    encryptedMessages = {};

    @observable
    initialized = false;

    constructor() {
        makeObservable(this);
    }

    @action
    async load(key) {
        this.encryptedMessages = await idb.get('data') ?? {};
        this.aes = new AES(key, key.slice(0, 16));
        this.messages = Object.fromEntries(
            await Promise.all(
                Object.entries(this.encryptedMessages).map(async ([key, value]) => [
                    key,
                    await Promise.all(value.map(async i => JSON.parse(await this.aes.decrypt(i))))
                ])
            )
        );
        this.initialized = true;
    }

    @action
    addIP(ip) {
        if (!this.initialized) {
            throw new Error('Class `MessageStore` has not been initialized');
        }
        if (!this.messages[ip]) {
            this.messages[ip] = [];
            this.encryptedMessages[ip] = [];
        }
    }

    @action
    async addMessage(ip, message) {
        this.addIP(ip);
        this.messages[ip].push(message);
        this.encryptedMessages[ip].push(await this.aes.encrypt(JSON.stringify(message)));
        await idb.set('data', toJS(this.encryptedMessages));
    }

    @computed
    get ips() {
        return Object.keys(this.messages);
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

    @action
    removeConnection(ip) {
        delete this.connections[ip];
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
    certsStore: new CertsStore(),
    messageStore: new MessageStore(),
    connectionStore: new ConnectionStore(),
    notificationStore: new NotificationStore(),
};
