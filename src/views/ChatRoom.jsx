import { IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, TextField, Typography } from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import { useStores } from '../hooks/useStores';
import { Messenger } from '../components/Messenger'
import { useStyles } from '../styles/chatRoom';
import { AddCircle as AddIcon, Cached as ConnectIcon } from '@material-ui/icons';
import { Notifier } from '../components/Notifier';
import { client } from '../utils/addon';
import { PasswordDialog } from '../components/PasswordDialog';

const { ipcRenderer } = window.require('electron');

export const ChatRoom = observer(() => {
    const classes = useStyles();
    const [ip, setIP] = useState('');
    const [input, setInput] = useState('');
    const { messageStore, connectionStore, notificationStore } = useStores();
    const connect = (ip) => {
        if (!connectionStore.connections[ip]) {
            client.connect(ip, 9999, (err, connection) => {
                if (err) {
                    notificationStore.enqueueError(err.message);
                } else {
                    connectionStore.addConnection(ip, connection);
                    messageStore.addIP(ip);
                    notificationStore.enqueueSuccess(`Connected to ${ip}`);
                }
            });
        }
    }
    useEffect(() => {
        ipcRenderer.on('connection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Connection from ${ip}`);
            connect(ip);
        });
        ipcRenderer.on('disconnection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Disconnection from ${ip}`);
        });
        ipcRenderer.on('message', async (event, { ip, data }) => {
            data = JSON.parse(data);
            data.isSelf = false;
            await messageStore.addMessage(ip, data);
            connect(ip);
        });
        ipcRenderer.on('error', (event, { message }) => {
            notificationStore.enqueueError(`Disconnection from ${message}`);
        });
    }, []);
    const addConnection = () => {
        notificationStore.enqueueInfo(`Connecting to ${input}`);
        connect(input.split('.').map(i => +i).join('.'));
        setInput('');
    }
    const reconnect = (ip) => () => {
        notificationStore.enqueueInfo(`Connecting to ${ip}`);
        connect(ip);
    }
    return (
        <>
            <PasswordDialog />
            <div className={classes.container}>
                <List component="nav" className={classes.list}>
                    <div className={classes.listItems}>
                        {messageStore.ips.map(i => (
                            <ListItem
                                button
                                selected={ip === i}
                                onClick={() => setIP(i)}
                                key={i}
                            >
                                <ListItemText primary={<Typography color={connectionStore.connections[i] ? 'primary' : 'secondary'}>{i}</Typography>} />
                                <ListItemSecondaryAction>
                                    <IconButton edge='end' onClick={reconnect(i)} disabled={!!connectionStore.connections[i]}>
                                        <ConnectIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </div>
                    <div className={classes.listInput}>
                        <TextField label="peer IP" variant="outlined" value={input} onChange={(event) => setInput(event.target.value)} />
                        <IconButton
                            color='primary'
                            component='span'
                            onClick={addConnection}
                            disabled={!input}
                        >
                            <AddIcon />
                        </IconButton>
                    </div>
                </List>
                {useMemo(() => <Messenger peerIP={ip} />, [ip])}
                <Notifier />
            </div>
        </>

    );
});
