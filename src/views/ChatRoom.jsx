import { IconButton, List, ListItem, ListItemText, TextField } from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import { useStores } from '../hooks/useStores';
import { Messenger } from '../components/Messenger'
import { useStyles } from '../styles/chatRoom';
import { AddCircle as AddIcon } from '@material-ui/icons';
import { Notifier } from '../components/Notifier';
import { client } from '../utils/addon';

const { ipcRenderer } = window.require('electron');

export const ChatRoom = observer(() => {
    const classes = useStyles();
    const [ip, setIP] = useState('');
    const [input, setInput] = useState('');
    const { messageStore, connectionStore, notificationStore } = useStores();
    useEffect(() => {
        ipcRenderer.on('connection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Connection from ${ip}`);
        });
        ipcRenderer.on('disconnection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Disconnection from ${ip}`);
        });
        ipcRenderer.on('message', (event, { ip, data }) => {
            data = JSON.parse(data);
            data.isSelf = false;
            messageStore.addMessage(ip, data);
            if (!connectionStore.connections[ip]) {
                client.connect(ip, 9999, (err, connection) => {
                    if (err) {
                        notificationStore.enqueueError(err.message);
                    } else {
                        connectionStore.addConnection(ip, connection);
                        notificationStore.enqueueSuccess(`Connected to ${ip}`);
                    }
                });
            }
        });
        ipcRenderer.on('error', (event, { message }) => {
            notificationStore.enqueueError(`Disconnection from ${message}`);
        });
    }, []);
    const connect = () => {
        if (!connectionStore.connections[input]) {
            notificationStore.enqueueInfo(`Connecting to ${input}`);
            client.connect(input, 9999, (err, connection) => {
                if (err) {
                    notificationStore.enqueueError(err.message);
                } else {
                    connectionStore.addConnection(input, connection);
                    notificationStore.enqueueSuccess(`Connected to ${input}`);
                }
            });
        }
        setInput('');
    }
    return (
        <div className={classes.container}>
            <List component="nav" className={classes.list}>
                <div className={classes.listItems}>
                    {connectionStore.ips.map(i => (
                        <ListItem
                            button
                            selected={ip === i}
                            onClick={() => setIP(i)}
                            key={i}
                        >
                            <ListItemText primary={i} />
                        </ListItem>
                    ))}
                </div>
                <div className={classes.listInput}>
                    <TextField label="peer IP" variant="outlined" value={input} onChange={(event) => setInput(event.target.value)} />
                    <IconButton
                        color='primary'
                        component='span'
                        onClick={connect}
                        disabled={!input}
                    >
                        <AddIcon />
                    </IconButton>
                </div>
            </List>
            {useMemo(() => <Messenger
                username='127.0.0.1'
                peerIP={ip}
            />, [ip])}
            <Notifier />
        </div>
    );
});
